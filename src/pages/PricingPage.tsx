import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import EnrollSection from "@/components/EnrollSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ScrollToTop from "@/components/ScrollToTop";
import StickyEnrollBar from "@/components/StickyEnrollBar";
import { ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent, logEngagementEvent } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBottomSlot } from "@/lib/bottomLayer";

const englishFaqs = [
  {
    q: "Do I need any experience to start?",
    a: "Absolutely not. We start from the very basics — Hangul letters, pronunciation, and everyday phrases. If you're a total beginner you'll be in the right place.",
  },
  {
    q: "What if I miss a class?",
    a: "Group classes are recorded and shared with enrolled students. Private students can reschedule with 24h notice. No class is ever wasted.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: "Yes. If you're not satisfied after your first paid class we'll refund you or rebook you. After that, refunds are prorated for unused sessions.",
  },
  {
    q: "How do I pay? Is it safe?",
    a: "In Egypt: bank transfer, Vodafone Cash or InstaPay. Upload the receipt and the enrollment is activated after a manual check. Outside Egypt: card payment through Stripe, activated automatically. Every payment is one-time; nothing renews or charges automatically.",
  },
  {
    q: "How many students are in a group class?",
    a: "Groups are kept small, so you still get personal attention and time to speak Korean in every session.",
  },
  {
    q: "Which platform do the classes use?",
    a: "All live classes run on Google Meet. You'll receive the link before each session. No download required — you can join from any browser.",
  },
];

const FAQ = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: t("pricingPage.faq1Q"), a: t("pricingPage.faq1A") },
    { q: t("pricingPage.faq2Q"), a: t("pricingPage.faq2A") },
    { q: t("pricingPage.faq3Q"), a: t("pricingPage.faq3A") },
    { q: t("pricingPage.faq4Q"), a: t("pricingPage.faq4A") },
    { q: t("pricingPage.faq5Q"), a: t("pricingPage.faq5A") },
    { q: t("pricingPage.faq6Q"), a: t("pricingPage.faq6A") },
  ];
  return (
    <section className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
          {t("pricingPage.faqTitle")}
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          {t("pricingPage.faqSubtitle")}
        </p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-start gap-4 hover:bg-muted/30 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-medium text-sm text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ExitNudge = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);
  const shownLogged = useRef(false);

  useEffect(() => {
    const trigger = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      setVisible(true);
      if (!shownLogged.current) {
        shownLogged.current = true;
        track.custom("exit_intent_shown", { page: "pricing" });
        // The sheet appearing is something that happened TO the visitor, not
        // a choice - engagement, not a lead (23 Sep 2026).
        logEngagementEvent({ source_type: "pricing_page", cta_label: "exit_intent_shown" });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) trigger();
    };

    let scrolledUp = 0;
    let lastY = window.scrollY;
    const handleScroll = () => {
      if (dismissed.current) return;
      const y = window.scrollY;
      if (y < lastY) scrolledUp += lastY - y;
      else scrolledUp = 0;
      lastY = y;
      if (scrolledUp > 250) trigger();
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleTrialClick = () => {
    track.custom("exit_intent_clicked", { page: "pricing", cta: "free_trial" });
    logLeadEvent({ source_type: "pricing", cta_label: "exit_intent_trial" });
  };

  const handleWaClick = () => {
    track.custom("exit_intent_clicked", { page: "pricing", cta: "whatsapp" });
    const url = `${WHATSAPP_BASE}?text=${encodeURIComponent(t("pricingPage.exitWaMessage"))}`;
    trackAndOpenWhatsApp(url, { cta_label: "pricing_exit_intent" });
  };

  // Claims the shared bottom layer (src/lib/bottomLayer.ts) so the sticky
  // enrol bar steps aside while this card is up. Without it, on phones the
  // card painted straight over the bar at bottom-0.
  const allowed = useBottomSlot("exitNudge", visible);
  if (!allowed) return null;

  // Non-blocking bottom sheet — the full-screen modal got 16 impressions
  // and 0 clicks because the blocker reflex ate the pitch before users
  // read it. This version is a pinned bottom card with ONE primary CTA,
  // WhatsApp demoted to a footer link, bilingual via existing i18n keys.
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none animate-in slide-in-from-bottom-2 duration-300">
      <div className="relative pointer-events-auto mx-auto max-w-lg bg-card border-2 border-primary/60 shadow-[0_20px_60px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden">
        <button
          onClick={() => setVisible(false)}
          aria-label={t("pricingPage.exitDismiss")}
          className="absolute top-2 end-2 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/free-trial"
          onClick={handleTrialClick}
          className="group flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors"
        >
          {/* Cluby holding his star, in place of the old gift emoji. */}
          <img
            src="/assets/cluby/cluby-star.webp"
            alt={isAr ? "كلوبي يحمل نجمة" : "Cluby holding a star"}
            width={333}
            height={440}
            decoding="async"
            className="h-14 w-auto flex-shrink-0 object-contain drop-shadow-sm"
          />
          <div className="flex-1 min-w-0 pe-6">
            <p className="font-bold text-foreground text-sm leading-tight">
              {t("pricingPage.exitTitle")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {t("pricingPage.exitBodyHighlight")}
            </p>
          </div>
          <div className="flex-shrink-0 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-[1.03] transition-all">
            {t("pricingPage.exitCta")}
          </div>
        </Link>
        <button
          onClick={handleWaClick}
          className="block w-full text-center text-[10px] text-muted-foreground hover:text-foreground py-1.5 border-t border-border/50 bg-muted/20"
        >
          {t("pricingPage.exitChat")}
        </button>
      </div>
    </div>
  );
};

/**
 * Story art above the tiers: the two friends and Cluby studying at a café
 * (story canon, /assets/cluby/cafe.webp). Kept short on phones (h-28) so the
 * tiers still start on the first screen.
 */
const PricingStory = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  return (
    <div className="container mx-auto px-4 pt-6 md:pt-10">
      <figure className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <img
          src="/assets/cluby/cafe.webp"
          alt={isAr ? "صديقان يدرسان الكورية مع كلوبي في مقهى" : "Two friends and Cluby studying Korean together at a café"}
          width={1200}
          height={800}
          decoding="async"
          className="h-28 w-full object-cover object-[center_45%] sm:h-40 md:h-56"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/85 via-charcoal/40 to-transparent px-4 pb-3 pt-10 text-start md:px-6 md:pb-4">
          <span className="font-display text-sm font-extrabold text-ivory md:text-lg">
            {isAr ? "صديقان، وطاولة واحدة في المقهى، وقليل من الكورية كل أسبوع." : "Two friends, one café table, a little more Korean every week."}
          </span>
        </figcaption>
      </figure>
    </div>
  );
};

const PricingPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "الأسعار والخطط" : "Pricing & Plans",
    description: isAr
      ? "أسعار كلوفرز تختلف حسب البلد. حصص جماعية مرة في الأسبوع لمدة شهر أو ٣ أو ٦ أشهر (٤ أو ١٢ أو ٢٤ حصة)، وحصص خاصة أيضًا."
      : "Klovers prices are set by country. Group classes once a week: 1, 3 or 6 months (4, 12 or 24 classes). Private classes too.",
    canonical: "https://kloversegy.com/pricing",
  });

  // Viewing pricing is interest, not a conversion (23 Sep 2026): the row is
  // kept in lead_events and GA4 gets `pricing_viewed`, but no Lead fires.
  useEffect(() => {
    track.ga("pricing_viewed", { language: document.documentElement.lang || undefined });
    logEngagementEvent({ source_type: "pricing_page", cta_label: "page_view" });
  }, []);

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "pricing-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Korean Language Course Plans",
      "description": "Klovers group and private Korean class plans, priced by country",
      "url": "https://kloversegy.com/pricing",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Course",
            "name": "Group Korean Classes",
            "provider": { "@type": "Organization", "name": "Klovers" },
            "inLanguage": "ko"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Course",
            "name": "Private Korean Classes",
            "provider": { "@type": "Organization", "name": "Klovers" },
            "inLanguage": "ko"
          }
        }
      ]
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => {
    const faqEl = document.createElement("script");
    faqEl.id = "pricing-faq-jsonld";
    faqEl.setAttribute("type", "application/ld+json");
    faqEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      // Follows the page language: /ar/pricing shows the Arabic FAQ, so its
      // FAQPage carries the same visible Arabic items.
      "mainEntity": (isAr
        ? [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`pricingPage.faq${n}Q`), a: t(`pricingPage.faq${n}A`) }))
        : englishFaqs
      ).map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    });
    document.head.appendChild(faqEl);
    return () => { faqEl.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is not memoised; items change only with the language
  }, [isAr]);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <PricingStory />
        <PricingSection />
        <TestimonialsSection />
        <FAQ />
        <EnrollSection />
      </main>
      <Footer />
      <ScrollToTop />
      <ExitNudge />
      <StickyEnrollBar />
    </div>
  );
};

export default PricingPage;

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
import { WHATSAPP_BASE } from "@/lib/siteConfig";

const faqs = [
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
    a: "Yes. If you're not satisfied after your first class we'll give you a full refund — no questions asked. After that, refunds are prorated for unused sessions.",
  },
  {
    q: "How do I pay? Is it safe?",
    a: "We accept bank transfer, Vodafone Cash, and InstaPay (Egypt) plus international card or PayPal. All payments are manually reviewed by our team before activation — no automatic charges.",
  },
  {
    q: "How many students are in a group class?",
    a: "Groups are kept small — usually 4 to 8 students — so you still get personal attention and time to speak Korean in every session.",
  },
  {
    q: "Which platform do the classes use?",
    a: "All live classes run on Zoom. You'll receive the link before each session. No download required — you can join from any browser.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-16 bg-muted/40">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
          Common Questions
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          Everything you need to know before enrolling
        </p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-muted/30 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
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
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dismissed.current && e.clientY < 60) {
        setVisible(true);
        dismissed.current = true; // show only once
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-black px-4 py-3 flex items-center justify-between gap-3 max-w-2xl mx-auto mb-4 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-semibold text-sm">Not sure which plan to pick?</p>
            <p className="text-xs text-black/70">Chat with us — we'll find the best fit for you.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I need help choosing a Klovers plan.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors"
          >
            WhatsApp
          </a>
          <button onClick={() => setVisible(false)} aria-label="Dismiss" className="text-black/60 hover:text-black">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => {
  useSEO({ title: "Pricing & Plans", description: "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.", canonical: "https://kloversegy.com/pricing" });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "pricing-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Korean Language Course Plans",
      "description": "Affordable Korean language learning plans at Klovers Academy",
      "url": "https://kloversegy.com/pricing",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Course",
            "name": "Group Korean Classes",
            "provider": { "@type": "Organization", "name": "Klovers Korean Academy" },
            "inLanguage": "ko"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Course",
            "name": "Private Korean Classes",
            "provider": { "@type": "Organization", "name": "Klovers Korean Academy" },
            "inLanguage": "ko"
          }
        }
      ]
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
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

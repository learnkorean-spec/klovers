import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import EnrollSection from "@/components/EnrollSection";
import ScrollToTop from "@/components/ScrollToTop";
import { X } from "lucide-react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

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
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-3 max-w-2xl mx-auto mb-4 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-semibold text-sm">Not sure which plan to pick?</p>
            <p className="text-xs text-primary-foreground/80">Chat with us — we'll find the best fit for you.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I need help choosing a Klovers plan.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
          >
            WhatsApp
          </a>
          <button onClick={() => setVisible(false)} aria-label="Dismiss" className="text-primary-foreground/70 hover:text-primary-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => {
  useSEO({ title: "Pricing & Plans", description: "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.", canonical: "https://kloversegy.com/pricing" });
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <PricingSection />
        <EnrollSection />
      </main>
      <Footer />
      <ScrollToTop />
      <ExitNudge />
    </div>
  );
};

export default PricingPage;

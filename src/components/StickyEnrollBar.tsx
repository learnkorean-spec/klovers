import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, MessageCircle } from "lucide-react";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBottomSlot } from "@/lib/bottomLayer";

/**
 * StickyEnrollBar — appears after the user scrolls past the hero CTA buttons.
 * Shows a slim bottom bar: Free Trial (primary) + "Still thinking? → Enroll Now" (secondary).
 * Dismissed by clicking X (stored in sessionStorage so it doesn't re-appear on the same visit).
 *
 * Yields to HomeExitNudge, which occupies the same bottom-0 strip at a higher
 * z-index — see src/lib/bottomLayer.ts. Hiding is the point: being painted
 * over is what produced the half-cut bar under the nudge card.
 *
 * 23 Sep 2026: the jumping cast (Klobi and the two students) that stood on
 * the bar's top edge is gone. It stood 56px ABOVE the bar, outside its box,
 * so it covered whatever card text was scrolling past on every screen - the
 * review listed it with the bar and the WhatsApp bubble as the three things
 * sitting on content. The floating WhatsApp bubble now hides while this bar
 * is up (WhatsAppButton.tsx), so the bar carries a WhatsApp icon of its own.
 */
const StickyEnrollBar = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show after user scrolls past 600px
  useEffect(() => {
    if (sessionStorage.getItem("enroll_bar_dismissed")) {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 600) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const allowed = useBottomSlot("stickyBar", visible && !dismissed);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("enroll_bar_dismissed", "1");
  };

  if (!allowed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-2 duration-300"
      role="complementary"
      aria-label={t("stickyBar.ariaLabel")}
    >
      <div className="relative bg-black border-t border-primary/40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 max-w-4xl mx-auto">
        {/* Left: text */}
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            <span className="text-primary font-bold">Klovers</span> — {t("stickyBar.tagline")}
          </p>
        </div>

        {/* Right: CTAs + dismiss.

            Free Trial carries the bold filled button here — it's the one
            primary conversion action everywhere else on the site (header,
            hero, FinalCTA), and #491 unified four competing "book a class"
            wordings around it. Enroll Now is the lighter secondary link,
            same as it would be on any other section of the page. */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={WHATSAPP_BASE}
            onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "sticky_bar_whatsapp" }); }}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={isAr ? "تواصل معنا على واتساب" : "Chat with us on WhatsApp"}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#25D366] hover:bg-white/10 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <Link
            to="/enroll-now"
            onClick={() => { try { logLeadEvent({ source_type: "enroll", cta_label: "sticky_bar_enroll_now" }); } catch {} }}
            className="text-xs font-semibold text-white/85 hover:text-white transition-colors hidden sm:block"
          >
            {t("stickyBar.enrollNow")}
          </Link>
          <Link
            to="/free-trial"
            onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "sticky_bar_free_trial" }); } catch {} }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity border border-black/25"
          >
            {t("stickyBar.freeTrial")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
          <button
            onClick={dismiss}
            aria-label={t("stickyBar.dismiss")}
            className="text-white/60 hover:text-white/90 transition-colors ms-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyEnrollBar;

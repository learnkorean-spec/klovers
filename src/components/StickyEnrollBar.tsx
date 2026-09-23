import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, MessageCircle } from "lucide-react";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBottomSlot } from "@/lib/bottomLayer";

/**
 * The bottom booking bar.
 *
 * 23 Sep 2026, CRO pass:
 *  - PHONES ONLY (below 768px). On desktop the header's Free Trial button and
 *    the CTA inside every section already give booking access; the bar only
 *    covered the bottom of every screen. Because it no longer claims the
 *    bottom slot on desktop, the floating WhatsApp bubble stays available
 *    there (see WhatsAppButton / bottomLayer).
 *  - ONE ACTION: "Book Free Class". No tagline, no Enroll Now link, no avatar
 *    cluster. Arabic keeps a small WhatsApp icon beside it, because the
 *    WhatsApp bubble steps aside while this bar is up and that market expects
 *    to be able to ask first.
 *  - IT NEVER COVERS CONTENT FOR GOOD: while it is up, the page gets bottom
 *    padding equal to the bar's measured height, so the last lines of the
 *    footer can always scroll clear of it. It respects the safe-area inset,
 *    and the button is at least 44px tall.
 *
 * Still yields to HomeExitNudge through src/lib/bottomLayer.ts. Dismissed per
 * visit (sessionStorage).
 */
const MOBILE_QUERY = "(max-width: 767px)";

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return mobile;
};

const StickyEnrollBar = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const isMobile = useIsMobile();
  const [scrolledPast, setScrolledPast] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("enroll_bar_dismissed")) {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 600) setScrolledPast(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const allowed = useBottomSlot("stickyBar", isMobile && scrolledPast && !dismissed);

  // Reserve the bar's height at the bottom of the page while it is shown.
  useEffect(() => {
    if (!allowed) return;
    const el = barRef.current;
    const prev = document.body.style.paddingBottom;
    const apply = () => { document.body.style.paddingBottom = `${el?.offsetHeight ?? 64}px`; };
    apply();
    const ro = typeof ResizeObserver !== "undefined" && el ? new ResizeObserver(apply) : null;
    if (ro && el) ro.observe(el);
    return () => { ro?.disconnect(); document.body.style.paddingBottom = prev; };
  }, [allowed]);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("enroll_bar_dismissed", "1");
  };

  if (!allowed) return null;

  return (
    <div
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-2 duration-300 border-t border-primary/40 bg-charcoal px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      role="complementary"
      aria-label={isAr ? "احجز حصتك المجانية" : "Book a free class"}
    >
      <div className="mx-auto flex max-w-md items-center gap-2">
        <Link
          to="/free-trial"
          onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "sticky_bar_free_trial", metadata: { language } }); } catch {} }}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {isAr ? "احجز حصتك المجانية" : "Book Free Class"}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
        {isAr && (
          <a
            href={WHATSAPP_BASE}
            onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "sticky_bar_whatsapp" }); }}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل معنا على واتساب"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#25D366] hover:bg-white/10 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
        <button
          onClick={dismiss}
          aria-label={isAr ? "إخفاء" : "Dismiss"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/60 hover:text-white/90 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default StickyEnrollBar;

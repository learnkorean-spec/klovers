import { WHATSAPP_NUMBER } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnyBottomSlotActive } from "@/lib/bottomLayer";

const WA_NUMBER = WHATSAPP_NUMBER;

/**
 * The floating WhatsApp bubble.
 *
 * 23 Sep 2026: it used to step aside while a bottom bar held the floor
 * (StickyEnrollBar, HomeExitNudge, InstallPrompt - src/lib/bottomLayer.ts),
 * because the bubble and the bars covered card text.
 * 6 Oct 2026 (Re): the help icon must always be there. It now stays visible
 * and rides up above the bar instead of disappearing, so a student is never
 * more than one tap from asking for help.
 */
const WhatsAppButton = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const bottomBarUp = useAnyBottomSlotActive();
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t("whatsappFab.message"))}`;

  return (
    <button
      type="button"
      onClick={() => trackAndOpenWhatsApp(waUrl, { cta_label: "floating_fab" })}
      aria-label={t("whatsappFab.ariaLabel")}
      className={`group fixed right-5 z-50 ${bottomBarUp ? "bottom-28 sm:bottom-24" : "bottom-6"} flex items-center justify-center w-14 h-14 rounded-full bg-klovers-yellow border-2 border-charcoal shadow-lg hover:brightness-95 hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`}
    >
      {/* Tooltip label — desktop only */}
      <span
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hidden sm:block ${isAr ? "left-[calc(100%+0.75rem)]" : "right-[calc(100%+0.75rem)]"}`}
        aria-hidden="true"
      >
        {isAr ? "التواصل عبر واتساب" : "Chat with us"}
      </span>
      {/* WhatsApp SVG icon */}
      <svg viewBox="0 0 32 32" fill="#2E2E2E" className="w-7 h-7" aria-hidden="true">
        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.472.658 4.792 1.806 6.8L2 30l7.374-1.786A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.4a11.354 11.354 0 01-5.8-1.594l-.416-.248-4.37 1.058 1.094-4.256-.272-.436A11.362 11.362 0 014.6 16C4.6 9.706 9.706 4.6 16 4.6S27.4 9.706 27.4 16 22.294 27.4 16 27.4zm6.22-8.506c-.34-.17-2.014-.994-2.326-1.108-.312-.112-.54-.17-.768.17-.228.34-.882 1.108-1.08 1.338-.2.228-.398.256-.738.086-.34-.17-1.436-.53-2.734-1.686-1.01-.9-1.692-2.012-1.89-2.352-.198-.34-.022-.524.148-.694.152-.152.34-.396.51-.594.17-.198.226-.34.34-.566.112-.228.056-.426-.028-.596-.086-.17-.768-1.848-1.052-2.532-.278-.666-.56-.576-.768-.586l-.654-.012c-.228 0-.596.086-.908.424-.312.34-1.19 1.162-1.19 2.834s1.218 3.288 1.388 3.516c.17.228 2.396 3.658 5.806 5.13.812.35 1.446.56 1.94.716.814.258 1.556.222 2.142.134.654-.096 2.014-.822 2.298-1.616.284-.792.284-1.472.198-1.614-.084-.14-.312-.226-.652-.396z" />
      </svg>
    </button>
  );
};

export default WhatsAppButton;

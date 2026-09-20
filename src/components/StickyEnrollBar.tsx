import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBottomSlot } from "@/lib/bottomLayer";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";

/**
 * StickyEnrollBar — appears after the user scrolls past the hero CTA buttons.
 * Shows a slim bottom bar: Free Trial (primary) + "Still thinking? → Enroll Now" (secondary).
 * Dismissed by clicking X (stored in sessionStorage so it doesn't re-appear on the same visit).
 *
 * Yields to HomeExitNudge, which occupies the same bottom-0 strip at a higher
 * z-index — see src/lib/bottomLayer.ts. Hiding is the point: being painted
 * over is what produced the half-cut bar under the nudge card.
 */
const StickyEnrollBar = () => {
  const { t } = useLanguage();
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
        {/* The cast stands ON the bar's top edge and jumps in place: squash on
            landing, stretch on take-off, a full turn in the air (perspective
            on the row makes the turn read as 3D), and a soft shadow on the
            edge that shrinks as they rise. No discs: they are the drawings
            themselves, with a thin white sticker edge so the outline still
            shows over dark sections of the page. Klobi alone below sm. */}
        <div className="pointer-events-none absolute bottom-full start-4 flex items-end gap-1 [perspective:500px]" aria-hidden="true">
          {[
            { name: "klobi-headphones", delay: "0s", cls: "" },
            { name: "student-girl-heart", delay: "0.35s", cls: "hidden sm:block" },
            { name: "student-boy-thumbsup", delay: "0.7s", cls: "hidden sm:block" },
          ].map(({ name, delay, cls }) => (
            <div key={name} className={`relative h-14 w-14 ${cls}`}>
              <span className="animate-bar-shadow absolute -bottom-1 left-1/2 h-2 w-9 -translate-x-1/2 rounded-full bg-black/40 blur-[2px]" style={{ animationDelay: delay }} />
              <div className="animate-bar-jump h-full w-full origin-bottom" style={{ animationDelay: delay }}>
                <KloverIcon name={name as KloverIconName} className="h-full w-full [filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_1px_#fff)]" />
              </div>
            </div>
          ))}
        </div>

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
            {t("stickyBar.freeTrial")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={dismiss}
            aria-label={t("stickyBar.dismiss")}
            className="text-white/60 hover:text-white/90 transition-colors ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyEnrollBar;

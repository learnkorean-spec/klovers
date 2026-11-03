// Homepage exit-intent — mirrors the pricing-page bottom sheet that's
// already showing ~17% CTR. Pricing is downstream; the homepage is where
// most traffic actually lands and bounces, so this is the bigger funnel
// catch. Routes to the placement test (5-min level discovery) rather
// than the trial form, because placement-test takers convert ~5x.
//
// Highest priority in the bottom layer (see src/lib/bottomLayer.ts): while
// this is up, the sticky enrol bar and the interview chip stand down. It
// used to simply paint over the enrol bar at a higher z-index, which left
// half a bar sticking out from under this card.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { logLeadEvent, logEngagementEvent } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { useLanguage } from "@/contexts/LanguageContext";
import KloverIcon from "@/components/KloverIcon";
import { useBottomSlot } from "@/lib/bottomLayer";

const STORAGE_KEY = "klovers_home_exit_nudge_shown_at";
// Only show again after 24h to avoid hammering returning visitors.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const HomeExitNudge = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);
  const shownLogged = useRef(false);

  useEffect(() => {
    // Skip entirely if user dismissed recently — respect attention.
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) {
        dismissed.current = true;
      }
    } catch { /* ignore */ }

    const trigger = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* ignore */ }
      setVisible(true);
      if (!shownLogged.current) {
        shownLogged.current = true;
        track.custom("home_exit_intent_shown", {});
        // Engagement, not a lead: this fires because the modal rendered, not
        // because anyone decided anything. It used to go through
        // logLeadEvent, which mirrors to the Meta Pixel as a `Lead`.
        logEngagementEvent({ source_type: "homepage", cta_label: "exit_intent_shown" });
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

    // Engagement gate: don't fire on landing — wait until they've spent
    // 8s reading. Filters out instant-bouncers from search-result mistakes.
    let timer: number | null = window.setTimeout(() => {
      document.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 8000);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const allowed = useBottomSlot("exitNudge", visible);

  // This one stays a lead: clicking through to the placement test is a
  // decision the visitor made.
  const handleClick = () => {
    track.custom("home_exit_intent_clicked", { cta: "placement_test" });
    logLeadEvent({ source_type: "placement_test", cta_label: "exit_intent_placement" });
  };

  if (!allowed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none animate-in slide-in-from-bottom-2 duration-300">
      <div className="pointer-events-auto mx-auto max-w-lg bg-card border-2 border-primary/60 shadow-[0_20px_60px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden">
        {/* The dismiss control owns a row instead of floating over the card.

            As an absolute 26x26 at `top-2 end-2` it already sat on the Start
            button: that button's box reaches 16px in from the card's end edge
            and is 44px tall, so the two overlapped by roughly 18x18px —
            invisible, because the dismiss only paints on hover, but taking
            taps meant for Start. Raising it to the 44px touch minimum (2.5.8
            asks for 24; 44 is this project's standard) turned that into a
            36x36 overlap, which is one button sitting on top of another.
            Space it owns is the only arrangement where both can be honest; it
            costs the card about 36px of height, and the text column no longer
            has to reserve room for something floating over it. */}
        <div className="flex justify-end pe-1 pt-1">
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label={isAr ? "إغلاق" : "Dismiss"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <Link
          to="/placement-test"
          onClick={handleClick}
          className="group flex items-center gap-4 px-4 pb-4 pt-1 hover:bg-primary/5 transition-colors"
        >
          <KloverIcon name="growth-chart" className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm leading-tight">
              {isAr ? "قبل المغادرة: معرفة المستوى في الكورية" : "Before you go: find your Korean level"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {isAr ? "مجاني · دون تسجيل · نتيجة فورية" : "Free · no sign-up · instant result"}
            </p>
          </div>
          <div className="flex-shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-[1.03] transition-all">
            {isAr ? "البدء" : "Start"} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HomeExitNudge;

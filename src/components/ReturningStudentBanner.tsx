import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "klovers-returning-banner-dismissed";

/**
 * WHY THIS BANNER NO LONGER NAMES A DISCOUNT
 *
 * It used to read "Welcome Back, Klovers! Returning students get 20% off"
 * to every signed-in visitor. Measured on production 2026-09-18: 101
 * accounts, 6 enrolment rows in total (3 of them soft-deleted), 3 live. So
 * roughly 98 of the people being offered a returning-student discount had
 * never enrolled in anything.
 *
 * The "Klovers" in that greeting was not a broken name merge either - the
 * string was fixed, so every reader saw the company's own name sitting where
 * a person's name appears to belong.
 *
 * GATING IT ON A FINISHED ENROLMENT WAS THE OBVIOUS FIX AND DOES NOT WORK.
 * `enrollments.enrollment_status` is free text with no check constraint, and
 * the only value it has ever held anywhere in the database is 'active'.
 * Nothing in this system records that an enrolment ended. A gate reading a
 * state nothing writes shows the banner to nobody, permanently, and says
 * nothing about it. That is a worse outcome than the bug.
 *
 * And the people this campaign is actually for - the students Re taught
 * across 13 years, off-platform - have no account and no enrolment row. No
 * database rule can find them. They are reached with a direct link to
 * /welcome-back in a WhatsApp, Telegram or Facebook message, not by a banner
 * on a page they are not signed in to.
 *
 * So the claim goes, not the audience. This now ASKS instead of asserting,
 * which is true for a first-time account holder and a former student alike,
 * and the offer and its terms stay on /welcome-back for whoever clicks.
 *
 * Copy is inline rather than t(): the three `returningStudents.banner.*`
 * keys live in src/i18n/translations.ts (231 KB), which cannot be rewritten
 * through the GitHub contents API. Those keys are now unreferenced - fold
 * this copy back into them whenever that file is next edited properly.
 */
const ReturningStudentBanner = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(() =>
    Boolean(localStorage.getItem(STORAGE_KEY))
  );

  // Signed out (the overwhelming majority of homepage traffic) is not
  // "returning", and a brand-new visitor should meet the hero, not this.
  if (dismissed || loading || !user) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="bg-green-600 text-white relative border-y border-green-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center pe-10">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {isAr ? "أهلاً بعودتك" : "Welcome back"}
          </span>
          <span className="text-sm font-medium">
            {isAr
              ? "درست مع Klovers قبل كده؟ كمّل من حيث ما وقفت."
              : "Studied with Klovers before? Pick up where you left off."}
          </span>
        </div>
        <Link
          to="/welcome-back"
          className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-secondary/90 transition-colors shrink-0"
        >
          {isAr ? "شوف خياراتك" : "See your options"}
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label={isAr ? "إغلاق" : "Dismiss"}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ReturningStudentBanner;

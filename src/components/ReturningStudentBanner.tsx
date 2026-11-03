import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "klovers-returning-banner-dismissed";

/*
 * `localStorage` throws on ACCESS, not on write, wherever storage is blocked -
 * Safari private browsing, "block all cookies", a locked-down webview. This
 * component reads it inside a useState initialiser, which runs during the
 * first render of the homepage, so an unguarded read is not a missing dismissal
 * - it is a blank page for every visitor in those browsers. Wrapped here rather
 * than by skipping the read: a visitor who cannot store the flag just sees the
 * banner again, which is the mild failure.
 */
const readDismissed = (): boolean => {
  try { return Boolean(localStorage.getItem(STORAGE_KEY)); } catch { return false; }
};

/**
 * WHO IS A RETURNING STUDENT, AND HOW THIS KNOWS
 *
 * This banner used to read "Returning students get 20% off" to every
 * signed-in visitor. Measured on production 2026-09-18: 101 accounts, and
 * `enrollments` held 6 rows in total. Roughly 98 of the people being offered
 * a returning-student discount had never enrolled in anything.
 *
 * The first attempt to gate it looked at `enrollments` and hit a wall:
 * `enrollment_status` is free text, and outside the soft-deleted rows the
 * only value it has ever held is 'active'. `sessions_remaining` is worse -
 * every paid row still reads 4 of 4, including one from March. Nothing in
 * that table records a course ending, so a gate built on it would have shown
 * the banner to nobody, permanently and silently. The claim was removed
 * instead (#481).
 *
 * `enrollments` was simply the wrong table. The live model is
 * `student_bundles` -> `teacher_students`, and it already has what was
 * missing:
 *
 *   - `student_bundles.status` is constrained by a CHECK to
 *     active | completed | cancelled, and 'completed' is genuinely in use -
 *     one bundle on production is completed with 4 of 4 sessions counted.
 *   - Marking a bundle complete is already part of the admin dashboard, so
 *     no new control and no migration were needed.
 *
 * Returning = at least one completed bundle, and no active one. Someone
 * mid-course has an active bundle and is a student, not a returning one.
 *
 * THE ROSTER ROW IS RESOLVED FIRST, ON PURPOSE. RLS does scope
 * student_bundles for a student ("Students read their own bundles"), but the
 * admin policy is ALL — an admin's unfiltered select returns EVERY student's
 * bundles, and Re is the admin. Filtering by her own teacher_students id is
 * correct for both, rather than correct for students and accidentally
 * harmless for her.
 *
 * TODAY THIS SHOWS TO NOBODY: the one student with a completed bundle also
 * has an active one, so she is studying, not returning. That is the rule
 * working, and it starts firing the day someone finishes a course and does
 * not renew. If it is still showing to nobody in a few months, check that
 * `student_bundles.status` is being moved to 'completed' before assuming
 * this is broken.
 *
 * Known gap: 2 of the 5 rows in `teacher_students` have a null `user_id`, so
 * those students cannot be matched to their account however much they study.
 * Linking them is admin work, not a code change.
 */
const ReturningStudentBanner = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(() =>
    readDismissed()
  );
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    if (!user) { setIsReturning(false); return; }
    let cancelled = false;

    void (async () => {
      try {
        const { data: roster, error: rosterError } = await supabase
          .from("teacher_students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        // No roster row means this account has never been a student of
        // record — the overwhelming majority of signups.
        if (cancelled || rosterError || !roster) return;

        const { data: bundles, error: bundleError } = await supabase
          .from("student_bundles")
          .select("status")
          .eq("student_id", roster.id);
        if (cancelled || bundleError || !bundles) return;

        const finished = bundles.some((b) => b.status === "completed");
        const current = bundles.some((b) => b.status === "active");
        setIsReturning(finished && !current);
      } catch {
        /* swallow — a banner is never worth breaking the page for */
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  // Signed out is not "returning", and a brand-new visitor should meet the
  // hero rather than this.
  if (dismissed || loading || !user || !isReturning) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* see readDismissed */ }
    setDismissed(true);
  };

  return (
    <div className="bg-charcoal text-ivory relative border-y border-charcoal">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center pe-14">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-ivory/20 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {isAr ? "أهلًا بالعودة" : "Welcome back"}
          </span>
          <span className="text-sm font-medium">
            {isAr
              ? "للطلاب الذين أنهوا دورتهم معنا: خصم ٢٠٪ عند العودة."
              : "You finished your course with us, come back and take 20% off."}
          </span>
        </div>
        <Link
          to="/welcome-back"
          className="inline-flex min-h-11 items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-secondary/90 transition-colors shrink-0"
        >
          {isAr ? "عرض العودة" : "See your offer"}
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex min-h-11 min-w-11 items-center justify-center hover:bg-white/20 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={isAr ? "إغلاق" : "Dismiss"}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ReturningStudentBanner;

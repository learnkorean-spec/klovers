import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const StudentDashboard = lazy(() => import("./StudentDashboard"));
const MyLessonsPage = lazy(() => import("./MyLessonsPage"));

/**
 * Which dashboard /dashboard means.
 *
 * The student dashboard is a Korean course: a Hangul vocabulary card, a Korean
 * textbook, a Discover Korea gallery, a Korean level. Klovers also teaches
 * English, and showing that page to an English student is not a cosmetic
 * mismatch — it is the wrong product.
 *
 * `profiles.track` is derived from the teaching roster's own `subject` by a
 * trigger, so nobody types it twice and it cannot drift from what Re recorded.
 * Anything that is not explicitly 'english' lands on the Korean dashboard,
 * which is what every existing student is.
 *
 * The read is deliberately narrow — one column, one row. Whatever it returns,
 * only one of the two chunks is ever fetched, so an English student never
 * downloads the Korean dashboard's bundle.
 */
const DashboardRouter = () => {
  const [track, setTrack] = useState<"korean" | "english" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const session = sessionData.session;
        if (!session) { if (!cancelled) setTrack("korean"); return; }

        const { data, error } = await supabase
          .from("profiles")
          .select("track")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        setTrack((data as { track?: string } | null)?.track === "english" ? "english" : "korean");
      } catch (err) {
        // A failed lookup must not leave a student on a spinner. The Korean
        // dashboard is the one every current student wants, so it is the
        // fallback — but the reason is logged rather than swallowed, because
        // "everyone silently became Korean" is exactly the kind of failure that
        // otherwise goes unnoticed for months.
        console.error("[DashboardRouter] could not read profiles.track:", err);
        if (!cancelled) setTrack("korean");
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const spinner = (
    <div role="status" aria-label="Loading" className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );

  if (track === null) return spinner;

  return (
    <Suspense fallback={spinner}>
      {track === "english" ? <MyLessonsPage /> : <StudentDashboard />}
    </Suspense>
  );
};

export default DashboardRouter;

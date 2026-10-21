import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sidebar counts, defined once.
 *
 * These used to be passed in by the Today page alone, so every other admin
 * page showed no badges, and Today's own definitions differed from the
 * dashboard's. Now the shell fetches them itself, and Today no longer
 * overrides them.
 *
 *   trials             pending trial bookings that are still live: waiting for a
 *                      date, or dated today or later. Past-dated pending bookings
 *                      are hidden from the trial list and are not counted.
 *   enrollments        approved but not yet paid (payment_status = PENDING_PAYMENT)
 *   teacherOnboarding  teachers still mid-onboarding (status = 'onboarding')
 */
export function useSidebarBadges() {
  return useQuery<{ trials: number; enrollments: number; teacherOnboarding: number }>({
    queryKey: ["admin", "sidebar-badges"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const [trials, enrollments, teacherOnboarding] = await Promise.all([
        supabase
          .from("trial_bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .or(`trial_date.is.null,trial_date.gte.${todayIso}`),
        supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "APPROVED")
          .eq("payment_status", "PENDING_PAYMENT")
          .is("deleted_at", null),
        // 42P01 = relation does not exist: the teacher_onboarding migration
        // may not be applied yet (this repo never auto-applies migrations,
        // see docs/APPLYING_MIGRATIONS.md). Treat that as "no badge" rather
        // than failing the whole sidebar-badges query and losing the two
        // badges above as well.
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("status", "onboarding"),
      ]);
      if (trials.error) throw trials.error;
      if (enrollments.error) throw enrollments.error;
      if (teacherOnboarding.error && teacherOnboarding.error.code !== "42P01") throw teacherOnboarding.error;
      return {
        trials: trials.count ?? 0,
        enrollments: enrollments.count ?? 0,
        teacherOnboarding: teacherOnboarding.error ? 0 : teacherOnboarding.count ?? 0,
      };
    },
  });
}

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
 *   trials       pending trial bookings that are still live: waiting for a
 *                date, or dated today or later. Past-dated pending bookings
 *                are hidden from the trial list and are not counted.
 *   enrollments  approved but not yet paid (payment_status = PENDING_PAYMENT)
 */
export function useSidebarBadges() {
  return useQuery<{ trials: number; enrollments: number }>({
    queryKey: ["admin", "sidebar-badges"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const [trials, enrollments] = await Promise.all([
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
      ]);
      if (trials.error) throw trials.error;
      if (enrollments.error) throw enrollments.error;
      return { trials: trials.count ?? 0, enrollments: enrollments.count ?? 0 };
    },
  });
}

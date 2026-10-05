import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_TRIAL_STATUS_LIST } from "@/constants/trialStatus";

export interface TrialStats {
  pending: number;
  upcoming: number;
  thisWeek: number;
  total: number;
}

export function useTrialStats() {
  return useQuery<TrialStats>({
    queryKey: ["admin", "trial-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAhead = new Date(today);
      weekAhead.setDate(weekAhead.getDate() + 7);
      const todayIso = today.toISOString().slice(0, 10);
      const weekIso = weekAhead.toISOString().slice(0, 10);

      const [pendingRes, upcomingRes, weekRes, totalRes] = await Promise.all([
        // Pending that is still live: waiting for a date (TBA) or dated today
        // or later. Past-dated pending bookings are not ongoing and are
        // hidden from the trial list, so they are not counted here either.
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }).eq("status", "pending").or(`trial_date.is.null,trial_date.gte.${todayIso}`).neq("trial_date", "2099-12-31"),
        // ACTIVE_TRIAL_STATUS_LIST, not ["pending","confirmed"]: the short list
        // omits awaiting_attendance and confirmed_attendance, which between them
        // are every booking the current flow writes — so these two counts read
        // as zero however many seats are held.
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }).gte("trial_date", todayIso).in("status", ACTIVE_TRIAL_STATUS_LIST),
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }).gte("trial_date", todayIso).lt("trial_date", weekIso).in("status", ACTIVE_TRIAL_STATUS_LIST),
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }),
      ]);

      return {
        pending: pendingRes.count ?? 0,
        upcoming: upcomingRes.count ?? 0,
        thisWeek: weekRes.count ?? 0,
        total: totalRes.count ?? 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

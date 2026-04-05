import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AttendanceReq, OverviewRow } from "@/types/admin";
import type { ProfileEntry } from "./useProfiles";

interface UseAttendanceRequestsOptions {
  profileMap?: Record<string, ProfileEntry>;
  overviewRows?: OverviewRow[];
}

/**
 * Fetches pending attendance requests with profile + credits enrichment.
 */
export function useAttendanceRequests({ profileMap, overviewRows }: UseAttendanceRequestsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "attendance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AttendanceReq[];
    },
    staleTime: 2 * 60 * 1000,
    select: (reqs) => {
      if (!profileMap) return reqs;
      const overviewMap: Record<string, OverviewRow> = {};
      if (overviewRows) {
        for (const r of overviewRows) overviewMap[r.user_id] = r;
      }
      return reqs.map((a) => {
        const ov = overviewMap[a.user_id];
        const profile = profileMap[a.user_id];
        return {
          ...a,
          profiles: profile
            ? { name: profile.name, email: profile.email, credits: ov?.sessions_remaining ?? 0 }
            : a.profiles,
        };
      });
    },
  });
}

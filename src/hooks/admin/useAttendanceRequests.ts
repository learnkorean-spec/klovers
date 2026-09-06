import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages, DEFAULT_PAGE_SIZE } from "@/lib/fetch-all-pages";
import type { AttendanceReq, OverviewRow } from "@/types/admin";
import type { ProfileEntry } from "./useProfiles";

interface UseAttendanceRequestsOptions {
  profileMap?: Record<string, ProfileEntry>;
  overviewRows?: OverviewRow[];
}

/**
 * Fetches attendance requests with profile + credits enrichment.
 *
 * Paged rather than capped. This was a bare `.limit(500)`, and
 * `pendingAttendance` is a count over this array — it drives the Groups tab
 * badge and the alert dot on the Learning group — so past 500 rows the badge
 * would have stopped moving with no error.
 *
 * This table grows faster than anything else in the admin: one row per
 * attendance request, which is one per student per session, forever.
 *
 * The `.order("id")` is load-bearing: offset paging needs a total ordering,
 * and `created_at` is not unique.
 *
 * Worth revisiting: the panel fetches every request ever made in order to
 * count the pending ones. A status filter, or a separate count query for the
 * badge, would keep the payload from growing without bound —
 * GroupAttendanceManager reads the full list today, so narrowing it is a
 * behaviour change rather than a correctness fix.
 */
export function useAttendanceRequests({ profileMap, overviewRows }: UseAttendanceRequestsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "attendance-requests"],
    queryFn: async () =>
      fetchAllPages<AttendanceReq>((from, to) =>
        supabase
          .from("attendance_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to) as unknown as PromiseLike<{ data: AttendanceReq[] | null; error: { message: string } | null }>,
        DEFAULT_PAGE_SIZE,
      ),
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

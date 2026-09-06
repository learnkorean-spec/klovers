import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages, DEFAULT_PAGE_SIZE } from "@/lib/fetch-all-pages";
import type { Enrollment } from "@/types/admin";
import type { ProfileEntry } from "./useProfiles";

interface UseEnrollmentsOptions {
  /** Profile map for enriching enrollments with name/email/level. */
  profileMap?: Record<string, ProfileEntry>;
}

/**
 * Fetches enrollments with optional profile enrichment.
 *
 * Paged rather than capped. This used to be a bare `.limit(500)`, and both the
 * Enrollments badge and the "N enrollments pending review or payment" banner
 * are counts over this array — so past 500 rows they would have stopped moving
 * without any error, at a number that still looked plausible.
 *
 * The `.order("id")` is load-bearing: offset paging needs a total ordering, and
 * `created_at` alone is not unique.
 */
export function useEnrollments({ profileMap }: UseEnrollmentsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "enrollments"],
    queryFn: async () =>
      fetchAllPages<Enrollment>((from, to) =>
        supabase
          .from("enrollments")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to) as unknown as PromiseLike<{ data: Enrollment[] | null; error: { message: string } | null }>,
        DEFAULT_PAGE_SIZE,
      ),
    staleTime: 2 * 60 * 1000,
    select: (enrollments) => {
      if (!profileMap) return enrollments;
      return enrollments.map((e) => ({
        ...e,
        profiles: profileMap[e.user_id]
          ? { name: profileMap[e.user_id].name, email: profileMap[e.user_id].email, level: profileMap[e.user_id].level ?? undefined }
          : e.profiles,
      }));
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages, DEFAULT_PAGE_SIZE } from "@/lib/fetch-all-pages";
import type { OverviewRow } from "@/types/admin";
export { buildOverviewByEmail } from "@/lib/overview-utils";

/**
 * Every row of `admin_student_overview` — one per profile.
 *
 * WHY THIS IS NOT A KEYSET CURSOR ANY MORE
 * It used to page with `.lt("joined_at", cursor)`, taking the cursor from the
 * last row of each page. Any row sharing that exact timestamp is then skipped:
 * it is not strictly less than the cursor, and it was not in the page just
 * read, so it falls between two pages and is never fetched at all.
 *
 * Tied `joined_at` values are ordinary — a bulk import writes dozens with the
 * same timestamp — and it only takes one tie landing on a page boundary. The
 * symptom is a Users count quietly short by a few, with no error anywhere.
 *
 * Offset paging has no cursor column to collide on. It does need a TOTAL
 * ordering, which is what the `user_id` tiebreaker provides: this view is one
 * row per profile, so user_id is unique across it.
 */
async function fetchAllOverviewRows(): Promise<OverviewRow[]> {
  return fetchAllPages<OverviewRow>((from, to) =>
    supabase
      .from("admin_student_overview")
      .select("*")
      .order("joined_at", { ascending: false })
      .order("user_id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<{ data: OverviewRow[] | null; error: { message: string } | null }>,
    DEFAULT_PAGE_SIZE,
  );
}

export function useStudentOverview() {
  return useQuery({
    queryKey: ["admin", "student-overview"],
    queryFn: fetchAllOverviewRows,
    staleTime: 2 * 60 * 1000,
  });
}

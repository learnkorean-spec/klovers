/**
 * The five lifecycle-funnel numbers, counted in Postgres.
 *
 * WHY THIS EXISTS
 *
 * 1. "Leads" was the wrong population. It counted profiles with no paid
 *    enrollment (derived_status = 'LEAD'), while the Leads screen beside it
 *    listed the `leads` CRM table. Same word, two meanings, one screen —
 *    100 against 124.
 *
 *    Verified on production: zero profiles have no matching lead by email.
 *    Everyone who registered came through `leads` first, so `leads` really is
 *    the top of the funnel and every stage below it is a subset. That is what
 *    lets the percentages nest and stay under 100 by construction; the old
 *    denominator was a bucket INSIDE the funnel, which is how "102% of leads"
 *    happened.
 *
 * 2. Every number was `array.length` over rows fetched into the browser. Some
 *    of those fetches carry a hard `.limit(500)` with no paging, so a count
 *    would have silently frozen once a table passed 500 rows. Others page with
 *    a keyset cursor on a timestamp, which skips rows sharing a timestamp with
 *    the last row of a page.
 *
 *    `count: 'exact'` with `head: true` asks Postgres for the number and
 *    transfers no rows at all. It cannot be capped, cannot skip, and does not
 *    grow more expensive as the tables do.
 *
 * STAGE DEFINITIONS
 *   leads       every row in `leads` — matches what the Leads screen lists
 *   registered  every profile
 *   enrolled    ACTIVE + COMPLETED + LOCKED — paid and approved at some point
 *   active      ACTIVE — currently has sessions left
 *   completed   COMPLETED only
 *
 * `completed` deliberately excludes LOCKED. LOCKED means a student overdrew
 * their sessions, which is the opposite of finishing; counting it as completed
 * flattered the last stage. Locked is reported in the Need Attention tile.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FunnelCounts {
  leads: number;
  registered: number;
  enrolled: number;
  active: number;
  completed: number;
}

/** Count rows without transferring any. */
async function countRows(
  table: "leads" | "profiles" | "admin_student_overview",
  status?: string[],
): Promise<number> {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (status) q = q.in("derived_status", status);

  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchFunnelCounts(): Promise<FunnelCounts> {
  const [leads, registered, enrolled, active, completed] = await Promise.all([
    countRows("leads"),
    countRows("profiles"),
    countRows("admin_student_overview", ["ACTIVE", "COMPLETED", "LOCKED"]),
    countRows("admin_student_overview", ["ACTIVE"]),
    countRows("admin_student_overview", ["COMPLETED"]),
  ]);

  return { leads, registered, enrolled, active, completed };
}

export function useFunnelCounts() {
  return useQuery({
    queryKey: ["admin", "funnel-counts"],
    queryFn: fetchFunnelCounts,
    staleTime: 60_000,
  });
}

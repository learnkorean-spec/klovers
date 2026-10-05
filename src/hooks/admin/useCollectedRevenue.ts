/**
 * Revenue actually collected: enrollments that are both PAID and APPROVED.
 *
 * WHY THIS EXISTS
 * The Total Revenue tile used to sum `amount` off `admin_student_overview`.
 * That view is one row per profile carrying only that profile's MOST RECENT
 * enrollment, and it carries no payment filter. So the total simultaneously
 *
 *   - counted unpaid and rejected enrollments as though they were income, and
 *   - dropped every earlier enrollment a returning student had actually paid.
 *
 * Two errors pulling in opposite directions produce a number that is not
 * collected revenue, not gross sales, and not reconcilable with either. On
 * production it read 27,916 EGP against 2,866 EGP actually received.
 *
 * This hook reads `enrollments` directly so every enrollment counts, and
 * filters to the two statuses that mean the money arrived.
 *
 * PAGING
 * `.range()` over an id-ordered query, not a keyset cursor on a timestamp.
 * `useStudentOverview` pages with `.lt("joined_at", cursor)`, which silently
 * skips any row sharing a timestamp with the last row of the previous page.
 * `id` is unique, so this cannot drop or double-count a row.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

export interface CollectedRevenue {
  /** Sum of `amount` over PAID + APPROVED enrollments. */
  total: number;
  /** Currency of those enrollments; falls back to EGP when there are none. */
  currency: string;
  /** How many enrollments the total is made of — shown under the tile. */
  count: number;
  /** Paid enrollments in a different currency, left out of `total`. */
  otherCurrencyCount: number;
}

export async function fetchCollectedRevenue(): Promise<CollectedRevenue> {
  const rows: { amount: number | null; currency: string | null }[] = [];

  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("enrollments")
      .select("amount, currency")
      .eq("payment_status", "PAID")
      .eq("approval_status", "APPROVED")
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  // One tile, one currency: summing EGP and USD into a single figure labelled
  // with whichever came first is wrong. Use the currency with the most rows
  // and report how many were left out.
  const perCurrency = new Map<string, number>();
  for (const r of rows) perCurrency.set(r.currency ?? "EGP", (perCurrency.get(r.currency ?? "EGP") ?? 0) + 1);
  const currency = [...perCurrency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "EGP";
  const mine = rows.filter((r) => (r.currency ?? "EGP") === currency);

  return {
    total: mine.reduce((sum, r) => sum + (r.amount ?? 0), 0),
    currency,
    count: mine.length,
    otherCurrencyCount: rows.length - mine.length,
  };
}

export function useCollectedRevenue() {
  return useQuery({
    queryKey: ["admin", "collected-revenue"],
    queryFn: fetchCollectedRevenue,
    staleTime: 60_000,
  });
}

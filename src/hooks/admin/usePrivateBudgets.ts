/**
 * Money collected from private students, kept one total per currency.
 *
 * WHY THIS EXISTS
 * `useCollectedRevenue` reads `enrollments` only, so every private student was
 * missing from the KPI strip entirely. On production that hid 11,100 EGP,
 * 135 MYR and 50 USD behind a tile reading 3,550 EGP — under a third of what
 * had actually come in.
 *
 * Private students do not go through checkout. Re enters each bundle by hand in
 * the currency that student pays in, which is why this hook never converts and
 * never sums across currencies: there is no rate in the system, and inventing
 * one would turn three exact figures into one wrong figure. Each currency is
 * reported on its own and the tile shows them side by side.
 *
 * WHAT COUNTS
 * An active bundle belonging to an active student. A bundle is voided by moving
 * it off `status = 'active'` (see `voided_reason` / `voided_at`), so filtering on
 * status is what keeps refunded and mistaken entries out of the total.
 *
 * PAGING
 * `.range()` over an id-ordered query — the same reason as useCollectedRevenue:
 * a keyset cursor on a timestamp silently drops rows that share a timestamp.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

export interface CurrencyTotal {
  currency: string;
  total: number;
  /** Bundles making up this currency's total. */
  count: number;
}

export interface PrivateBudgets {
  /** One entry per currency, largest total first. Empty when there are none. */
  byCurrency: CurrencyTotal[];
  /** Total number of bundles across all currencies. */
  count: number;
  /** Distinct private students those bundles belong to. */
  students: number;
}

interface BundleRow {
  student_id: string;
  total_price: number | null;
  currency: string | null;
}

export async function fetchPrivateBudgets(): Promise<PrivateBudgets> {
  const rows: BundleRow[] = [];

  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("student_bundles")
      .select("student_id, total_price, currency, teacher_students!inner(status)")
      .eq("status", "active")
      .eq("teacher_students.status", "active")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as unknown as BundleRow[]));
    if (data.length < PAGE_SIZE) break;
  }

  const totals = new Map<string, CurrencyTotal>();
  const students = new Set<string>();

  for (const row of rows) {
    // A bundle with no currency is a hand-entry that was never finished. Leaving
    // it out of a currency bucket is safer than guessing it is EGP and quietly
    // moving the headline figure.
    if (!row.currency) continue;
    const bucket = totals.get(row.currency) ?? { currency: row.currency, total: 0, count: 0 };
    bucket.total += Number(row.total_price ?? 0);
    bucket.count += 1;
    totals.set(row.currency, bucket);
    students.add(row.student_id);
  }

  return {
    byCurrency: [...totals.values()].sort((a, b) => b.total - a.total),
    count: rows.length,
    students: students.size,
  };
}

export function usePrivateBudgets() {
  return useQuery({
    queryKey: ["admin", "private-budgets"],
    queryFn: fetchPrivateBudgets,
    staleTime: 60_000,
  });
}

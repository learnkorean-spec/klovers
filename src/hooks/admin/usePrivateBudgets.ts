/**
 * Money in from private students, kept one total per currency — and what is
 * still owed.
 *
 * WHY THIS EXISTS
 * `useCollectedRevenue` reads `enrollments` only, so every private student was
 * missing from the money figures entirely.
 *
 * WHAT COUNTS, AND WHY IT IS NOT `status`
 * A bundle is paid when `paid_on` is set. It used to be counted when its
 * `status` was 'active', which is a statement about how much teaching is left,
 * not about money. Mariam Harb had both halves of that wrong at once: her PAID
 * July bundle was excluded for being completed, and her UNPAID August bundle —
 * two classes already taught on it — was counted as income in full.
 *
 * So the query now takes every bundle that has not been cancelled or voided,
 * and `paid_on` decides which side it lands on: a total, or the list of what is
 * owed. A finished bundle that was paid for is still money that came in.
 *
 * NO CONVERSION
 * Private students do not go through checkout. Re enters each bundle by hand in
 * the currency that student pays in, and there is no rate anywhere in the
 * system. Summing across currencies would turn several exact figures into one
 * wrong one, so each currency is reported on its own.
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
  /** Paid bundles making up this currency's total. */
  count: number;
}

/** A bundle with no `paid_on` — taught, or about to be, and not paid for. */
export interface UnpaidBundle {
  id: string;
  student: string;
  label: string | null;
  total_price: number;
  currency: string | null;
  purchased_on: string | null;
}

export interface PrivateBudgets {
  /** One entry per currency, largest total first. Paid bundles only. */
  byCurrency: CurrencyTotal[];
  /** Paid bundles across all currencies. */
  count: number;
  /** Distinct students who have paid for something. */
  students: number;
  /** Still owed, oldest purchase first. */
  unpaid: UnpaidBundle[];
}

interface BundleRow {
  id: string;
  student_id: string;
  label: string | null;
  total_price: number | null;
  currency: string | null;
  purchased_on: string | null;
  paid_on: string | null;
  teacher_students: { full_name: string | null } | null;
}

export async function fetchPrivateBudgets(): Promise<PrivateBudgets> {
  const rows: BundleRow[] = [];

  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("student_bundles")
      .select(
        "id, student_id, label, total_price, currency, purchased_on, paid_on, " +
        "teacher_students(full_name)"
      )
      .neq("status", "cancelled")
      .is("voided_at", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as unknown as BundleRow[]));
    if (data.length < PAGE_SIZE) break;
  }

  const totals = new Map<string, CurrencyTotal>();
  const students = new Set<string>();
  const unpaid: UnpaidBundle[] = [];
  let paidCount = 0;

  for (const row of rows) {
    if (!row.paid_on) {
      unpaid.push({
        id: row.id,
        student: row.teacher_students?.full_name ?? "Unnamed student",
        label: row.label,
        total_price: Number(row.total_price ?? 0),
        currency: row.currency,
        purchased_on: row.purchased_on,
      });
      continue;
    }

    paidCount++;
    students.add(row.student_id);

    // A paid bundle with no currency cannot join a total without someone
    // guessing which one it is. It stays out rather than quietly moving the
    // headline figure; the student's own row still shows the price.
    if (!row.currency) continue;
    const bucket = totals.get(row.currency) ?? { currency: row.currency, total: 0, count: 0 };
    bucket.total += Number(row.total_price ?? 0);
    bucket.count += 1;
    totals.set(row.currency, bucket);
  }

  unpaid.sort((a, b) => (a.purchased_on ?? "").localeCompare(b.purchased_on ?? ""));

  return {
    byCurrency: [...totals.values()].sort((a, b) => b.total - a.total),
    count: paidCount,
    students: students.size,
    unpaid,
  };
}

export function usePrivateBudgets() {
  return useQuery({
    queryKey: ["admin", "private-budgets"],
    queryFn: fetchPrivateBudgets,
    staleTime: 60_000,
  });
}

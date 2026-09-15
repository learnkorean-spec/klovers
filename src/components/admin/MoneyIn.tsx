/**
 * MONEY IN — what has actually been collected, group and private side by side,
 * and what is still owed.
 *
 * WHY IT IS ON TODAY
 * The KPI strip that carries these figures is drawn by AdminDashboard, above
 * its `?tab=` screens, and bare /admin redirects to /admin/today. So the screen
 * Re opens every morning showed no money at all. A number nobody passes is a
 * number nobody reads.
 *
 * WHY TWO CARDS AND NOT ONE TOTAL
 * Group students pay through checkout in EGP; private students are entered by
 * hand, each in the currency that student pays in. The system holds no exchange
 * rate, so there is no honest single number — adding them would turn several
 * exact figures into one wrong one.
 *
 * WHY THE UNPAID LIST IS HERE AND NOT BURIED
 * A bundle with no `paid_on` is a student being taught on credit. Mariam had
 * two classes taught against an unpaid bundle and nothing anywhere said so — it
 * was being counted as income instead. It belongs on the screen that lists what
 * needs a decision, with the one control that resolves it.
 *
 * No new queries: both hooks are the ones the KPI strip already uses, and
 * react-query serves them from the same cache.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCollectedRevenue } from "@/hooks/admin/useCollectedRevenue";
import { usePrivateBudgets } from "@/hooks/admin/usePrivateBudgets";

function formatMoney(n: number): string {
  return n.toLocaleString("en-US");
}

/** Today in Cairo, as YYYY-MM-DD — the default answer to "when was this paid". */
function todayInCairo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
}

const MoneyIn = () => {
  const queryClient = useQueryClient();
  const { data: revenue, isLoading: revenueLoading } = useCollectedRevenue();
  const { data: privateBudgets, isLoading: privateLoading } = usePrivateBudgets();

  const [dates, setDates] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markPaid(id: string, fallback: string | null) {
    const when = dates[id] ?? fallback ?? todayInCairo();
    setBusy(id);
    setError(null);
    const { error: updateError } = await supabase
      .from("student_bundles")
      .update({ paid_on: when })
      .eq("id", id);
    setBusy(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin", "private-budgets"] });
  }

  if (revenueLoading || privateLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const currencies = privateBudgets?.byCurrency ?? [];
  const unpaid = privateBudgets?.unpaid ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5 flex h-full flex-col gap-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-bold tracking-[0.04em]">GROUP REVENUE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
                {revenue ? formatMoney(revenue.total) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">{revenue?.currency ?? ""}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {revenue
                ? `Paid and approved · ${revenue.count} enrollment${revenue.count === 1 ? "" : "s"}.`
                : "Paid and approved enrollments."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex h-full flex-col gap-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-bold tracking-[0.04em]">PRIVATE BUDGETS</span>
            </div>
            {currencies.length === 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold leading-none tracking-tight">—</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nothing marked as paid yet.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  {currencies.map(c => (
                    <div key={c.currency} className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold leading-none tracking-tight tabular-nums">
                        {formatMoney(c.total)}
                      </span>
                      <span className="text-sm text-muted-foreground">{c.currency}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Received from {privateBudgets?.students} student
                  {privateBudgets?.students === 1 ? "" : "s"}, each in their own currency.
                  Not converted — there is no rate in the system.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {unpaid.length > 0 && (
        <Card className="border-foreground">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-bold tracking-[0.04em] text-muted-foreground">
                NOT MARKED AS PAID — {unpaid.length}
              </span>
              <span className="text-xs text-muted-foreground">
                until one is marked, its money is not counted anywhere
              </span>
            </div>

            <ul className="space-y-2">
              {unpaid.map(b => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{b.student}</span>
                    {" · "}
                    <span className="tabular-nums">{formatMoney(b.total_price)}</span>{" "}
                    {b.currency ?? ""}
                    {b.label ? ` · ${b.label}` : ""}
                  </span>
                  <input
                    type="date"
                    aria-label={`Date ${b.student} paid`}
                    value={dates[b.id] ?? b.purchased_on ?? todayInCairo()}
                    onChange={e => setDates(d => ({ ...d, [b.id]: e.target.value }))}
                    className="rounded-lg border bg-background px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void markPaid(b.id, b.purchased_on)}
                    disabled={busy === b.id}
                    className="rounded-lg border bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {busy === b.id ? "Saving…" : "Mark paid"}
                  </button>
                </li>
              ))}
            </ul>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MoneyIn;

/**
 * MONEY IN — what has actually been collected, group and private side by side.
 *
 * WHY IT IS ON TODAY
 * The KPI strip that carries these two figures is drawn by AdminDashboard,
 * above its `?tab=` screens. Bare /admin redirects to /admin/today, so the
 * screen Re opens every morning showed no money at all and the tiles could only
 * be reached by first picking some unrelated tab. A number nobody passes is a
 * number nobody reads.
 *
 * WHY TWO CARDS AND NOT ONE TOTAL
 * Group students pay through checkout in EGP; private students are entered by
 * hand, each in the currency that student pays in. The system holds no exchange
 * rate, so there is no honest single number — adding them would turn several
 * exact figures into one wrong one. Each currency keeps its own line.
 *
 * No new queries: both hooks are the ones the KPI strip already uses, and
 * react-query serves them from the same cache.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Wallet } from "lucide-react";
import { useCollectedRevenue } from "@/hooks/admin/useCollectedRevenue";
import { usePrivateBudgets } from "@/hooks/admin/usePrivateBudgets";

function formatMoney(n: number): string {
  return n.toLocaleString("en-US");
}

const MoneyIn = () => {
  const { data: revenue, isLoading: revenueLoading } = useCollectedRevenue();
  const { data: privateBudgets, isLoading: privateLoading } = usePrivateBudgets();

  if (revenueLoading || privateLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const currencies = privateBudgets?.byCurrency ?? [];

  return (
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
                No active private bundles.
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
                Entered by hand, each in the currency that student pays in ·{" "}
                {privateBudgets?.students} student{privateBudgets?.students === 1 ? "" : "s"}.
                Not converted — there is no rate in the system.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MoneyIn;

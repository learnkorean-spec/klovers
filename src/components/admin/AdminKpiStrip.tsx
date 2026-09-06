import { useMemo, memo } from "react";
import { Users, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, Tooltip as RechartsTooltip } from "recharts";
import { AT_RISK_SESSION_THRESHOLD } from "@/lib/admin-utils";
import { useCollectedRevenue } from "@/hooks/admin/useCollectedRevenue";
import type { OverviewRow } from "@/types/admin";

interface Props {
  overviewRows: OverviewRow[];
  actionableEnrollments: number;
  isLoading: boolean;
}

interface KpiCard {
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  sublabel?: string;
  alert?: boolean;
  sparkData?: { v: number }[];
  sparkColor?: string;
}

/** Build a 7-day enrollment count sparkline from overviewRows */
function buildEnrollmentSparkline(rows: OverviewRow[]): { v: number }[] {
  const now = Date.now();
  const counts = new Array(7).fill(0);
  for (const r of rows) {
    const daysAgo = Math.floor((now - new Date(r.joined_at).getTime()) / 86_400_000);
    if (daysAgo >= 0 && daysAgo < 7) counts[6 - daysAgo]++;
  }
  return counts.map(v => ({ v }));
}

/**
 * Abbreviate only where abbreviating cannot mislead.
 *
 * The old formatter sent anything over 1,000 through `.toFixed(0)` + "K", so
 * 2,866 rendered as "3K" — a 5% rounding error on the exact figure that was
 * wrong in the first place. Below 10,000 the full number fits in the tile, so
 * show it; above that, a rounded K/M reads more easily than seven digits.
 */
function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-US");
}

export const AdminKpiStrip = memo(function AdminKpiStrip({ overviewRows, actionableEnrollments, isLoading }: Props) {
  const { data: revenue, isLoading: revenueLoading } = useCollectedRevenue();

  const kpis = useMemo<KpiCard[]>(() => {
    const activeRows = overviewRows.filter(r => r.derived_status === "ACTIVE");
    // `> 0` is deliberate: a student at exactly 0 sessions is COMPLETED, not
    // ACTIVE, so they are already outside activeRows. At-risk means "running
    // low", not "run out".
    const atRisk = activeRows.filter(
      r => r.sessions_remaining <= AT_RISK_SESSION_THRESHOLD && r.sessions_remaining > 0
    );
    const locked = overviewRows.filter(r => r.derived_status === "LOCKED");

    const enrollSparkline = buildEnrollmentSparkline(overviewRows);

    return [
      {
        icon: Users,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        value: activeRows.length,
        label: "Active Students",
        sublabel: `${overviewRows.length} total`,
        sparkData: enrollSparkline,
        sparkColor: "#3b82f6",
      },
      {
        icon: DollarSign,
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        // Money received: PAID + APPROVED enrollments, all of them, not just
        // each student's most recent. See useCollectedRevenue.
        value: revenue ? `${formatMoney(revenue.total)} ${revenue.currency}` : "—",
        label: "Total Revenue",
        sublabel: revenue ? `paid · ${revenue.count} enrollments` : "paid enrollments",
      },
      {
        icon: AlertTriangle,
        iconBg: atRisk.length > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted",
        iconColor: atRisk.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        value: atRisk.length,
        label: "At-Risk Students",
        sublabel: `≤${AT_RISK_SESSION_THRESHOLD} sessions left`,
        alert: atRisk.length > 0,
      },
      {
        icon: TrendingUp,
        iconBg: actionableEnrollments > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted",
        iconColor: actionableEnrollments > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
        value: actionableEnrollments + locked.length,
        label: "Need Attention",
        sublabel: `${actionableEnrollments} pending · ${locked.length} locked`,
        alert: actionableEnrollments > 0 || locked.length > 0,
      },
    ];
  }, [overviewRows, actionableEnrollments, revenue]);

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      role="region"
      aria-label="Key performance indicators"
      aria-busy={isLoading}
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        // The revenue tile has its own query, so it keeps its skeleton until
        // that resolves rather than following the shared overview spinner.
        const cardLoading = isLoading || (kpi.label === "Total Revenue" && revenueLoading);
        return (
          <div
            key={kpi.label}
            className={`rounded-2xl border bg-card px-4 py-3 flex items-center gap-3 transition-shadow hover:shadow-sm ${kpi.alert ? "border-amber-300/60 dark:border-amber-700/40" : "border-border"}`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
              <Icon className={`h-4 w-4 ${kpi.iconColor}`} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              {cardLoading ? (
                <div className="h-5 w-12 bg-muted animate-pulse rounded mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground leading-tight tabular-nums">{kpi.value}</p>
              )}
              <p className="text-[11px] font-medium text-foreground/80 leading-tight truncate">{kpi.label}</p>
              {kpi.sublabel && (
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{kpi.sublabel}</p>
              )}
            </div>
            {kpi.sparkData && kpi.sparkData.length > 0 && !isLoading && (
              <div className="w-14 h-8 shrink-0" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.sparkData}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={kpi.sparkColor ?? "#94a3b8"}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 10, padding: "2px 6px" }}
                      formatter={(v: number) => [v, "enrollments"]}
                      labelFormatter={() => ""}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

import { useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, AlertTriangle, DollarSign, Wallet, Archive } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, Tooltip as RechartsTooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AT_RISK_SESSION_THRESHOLD } from "@/lib/admin-utils";
import { useCollectedRevenue } from "@/hooks/admin/useCollectedRevenue";
import { usePrivateBudgets } from "@/hooks/admin/usePrivateBudgets";
import type { OverviewRow } from "@/types/admin";
import { scrollToAdminTabs } from "@/lib/admin/scrollToAdminTabs";

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
  /**
   * Where the tile opens. Every tile has one: a number on the dashboard is
   * only useful if the list behind it is one click away.
   */
  to: string;
  /** Screen name for the link's accessible label ("open Enrollments"). */
  opens: string;
  /** `data-admin-focus` marker to scroll to once the screen opens. */
  focus?: string;
  /**
   * When one tile counts two different things (Need Attention: pending
   * enrollments + locked students), each part gets its own link to its own
   * list, drawn in place of the sublabel.
   */
  parts?: { text: string; to: string; focus?: string }[];
}

/** Tiles that run their own query and so keep their own skeleton. */
const GROUP_REVENUE_LABEL = "Group Revenue";
const PRIVATE_BUDGETS_LABEL = "Private Budgets";
const LEGACY_LABEL = "Legacy 2022–2025";

/**
 * Historical students imported into Legacy Data (admin-only tables).
 *
 * Kept in its own tile and never added to Active Students or Group Revenue:
 * legacy students have no account and no live enrolment, and their "session
 * value" is sessions x price, not money received. Only recorded_paid is
 * money, and it is shown as such.
 */
function useLegacyTotals() {
  return useQuery({
    queryKey: ["admin", "legacy", "kpi"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [{ count, error: cErr }, { data, error: yErr }] = await Promise.all([
        db.from("legacy_students").select("id", { count: "exact", head: true }),
        db.from("legacy_year_summary").select("counted_sessions, recorded_paid"),
      ]);
      if (cErr) throw cErr;
      if (yErr) throw yErr;
      const rows = (data ?? []) as { counted_sessions: number; recorded_paid: string | number | null }[];
      return {
        students: count ?? 0,
        sessions: rows.reduce((a, r) => a + Number(r.counted_sessions ?? 0), 0),
        paid: rows.reduce((a, r) => a + Number(r.recorded_paid ?? 0), 0),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
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
/** Legacy records predate multi-currency and carry no currency column; they were all taken in EGP. */
const LEGACY_CURRENCY = "EGP";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-US");
}

export const AdminKpiStrip = memo(function AdminKpiStrip({ overviewRows, actionableEnrollments, isLoading }: Props) {
  const { data: revenue, isLoading: revenueLoading } = useCollectedRevenue();
  const { data: privateBudgets, isLoading: privateLoading } = usePrivateBudgets();
  const { data: legacy, isLoading: legacyLoading } = useLegacyTotals();

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

    // Private students pay in their own currency and their bundles are entered
    // by hand, so there is no rate to convert with. The largest currency leads
    // the tile and the others sit underneath it, each still exact.
    const [leadCurrency, ...otherCurrencies] = privateBudgets?.byCurrency ?? [];
    const privateSublabel = privateBudgets
      ? [
          ...otherCurrencies.map(c => `${formatCompact(c.total)} ${c.currency}`),
          `${privateBudgets.students} student${privateBudgets.students === 1 ? "" : "s"}`,
        ].join(" · ")
      : "entered by hand";

    // Palette per the brand guard: klovers-green (always a fill, charcoal on
    // it) = live / money in, klovers-yellow = needs a look, muted = neutral,
    // destructive only for something that is actually wrong.
    return [
      {
        icon: Users,
        iconBg: "bg-klovers-green",
        iconColor: "text-charcoal",
        value: activeRows.length,
        label: "Active Students",
        sublabel: legacy && legacy.students > 0
          ? `${overviewRows.length} total · +${legacy.students} legacy`
          : `${overviewRows.length} total`,
        sparkData: enrollSparkline,
        to: "/admin?tab=students&filter=active",
        opens: "the active students",
      },
      {
        icon: DollarSign,
        iconBg: "bg-klovers-green",
        iconColor: "text-charcoal",
        // Money received: PAID + APPROVED enrollments, all of them, not just
        // each student's most recent. See useCollectedRevenue. Named "Group"
        // because that is all it has ever counted — private students go through
        // no checkout and have no enrollment row, so they are in the tile next
        // to this one, not in this total.
        value: revenue ? `${formatCompact(revenue.total)} ${revenue.currency}` : "—",
        label: GROUP_REVENUE_LABEL,
        sublabel: revenue ? `paid · ${revenue.count} enrollments` : "paid enrollments",
        to: "/admin?tab=sales",
        opens: "Sales",
      },
      {
        icon: Wallet,
        iconBg: "bg-klovers-yellow",
        iconColor: "text-charcoal",
        value: leadCurrency ? `${formatCompact(leadCurrency.total)} ${leadCurrency.currency}` : "—",
        label: PRIVATE_BUDGETS_LABEL,
        sublabel: privateSublabel,
        // Private students and their bundles are kept in My students.
        to: "/admin?tab=my-students",
        opens: "My students",
      },
      {
        icon: Archive,
        iconBg: "bg-muted",
        iconColor: "text-foreground",
        value: legacy ? legacy.students : "—",
        label: LEGACY_LABEL,
        sublabel: legacy
          ? `${legacy.sessions.toLocaleString("en-US")} sessions · paid ${formatCompact(legacy.paid)} ${LEGACY_CURRENCY}`
          : "historical students",
        to: "/admin?tab=legacy",
        opens: "Legacy Data",
      },
      {
        icon: AlertTriangle,
        iconBg: atRisk.length > 0 ? "bg-klovers-yellow" : "bg-muted",
        iconColor: atRisk.length > 0 ? "text-charcoal" : "text-muted-foreground",
        value: atRisk.length,
        label: "At-Risk Students",
        sublabel: `≤${AT_RISK_SESSION_THRESHOLD} sessions left`,
        alert: atRisk.length > 0,
        to: "/admin?tab=students&filter=atrisk",
        opens: "the at-risk students",
      },
      {
        icon: TrendingUp,
        iconBg: actionableEnrollments > 0 ? "bg-destructive/15" : "bg-muted",
        iconColor: actionableEnrollments > 0 ? "text-destructive" : "text-muted-foreground",
        value: actionableEnrollments + locked.length,
        label: "Need Attention",
        sublabel: `${actionableEnrollments} pending · ${locked.length} locked`,
        alert: actionableEnrollments > 0 || locked.length > 0,
        // The tile itself opens whichever half has something in it, pending
        // first; each half is also its own link underneath.
        to: actionableEnrollments > 0 || locked.length === 0
          ? "/admin?tab=enrollments&status=attention"
          : "/admin?tab=students&filter=locked",
        focus: actionableEnrollments > 0 || locked.length === 0 ? "enrollments" : undefined,
        opens: actionableEnrollments > 0 || locked.length === 0 ? "the pending enrollments" : "the locked students",
        parts: [
          { text: `${actionableEnrollments} pending`, to: "/admin?tab=enrollments&status=attention", focus: "enrollments" },
          { text: `${locked.length} locked`, to: "/admin?tab=students&filter=locked" },
        ],
      },
    ];
  }, [overviewRows, actionableEnrollments, revenue, privateBudgets, legacy]);

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
      role="region"
      aria-label="Key performance indicators"
      aria-busy={isLoading}
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        // The money and legacy tiles have their own queries, so each keeps its
        // skeleton until that resolves rather than following the shared spinner.
        const cardLoading =
          isLoading ||
          (kpi.label === GROUP_REVENUE_LABEL && revenueLoading) ||
          (kpi.label === PRIVATE_BUDGETS_LABEL && privateLoading) ||
          (kpi.label === LEGACY_LABEL && legacyLoading);
        // Stretched-link pattern: the whole tile is clickable through the
        // main link's ::after overlay, and the part links sit above it
        // (relative z-10) — two links side by side, never one inside another.
        const className = `relative rounded-2xl border bg-card px-4 py-3 flex items-center gap-3 cursor-pointer transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-klovers-yellow ${kpi.alert ? "border-klovers-yellow" : "border-border"}`;
        const body = (
          <>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
              <Icon className={`h-4 w-4 ${kpi.iconColor}`} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                to={kpi.to}
                onClick={() => scrollToAdminTabs(kpi.focus)}
                aria-label={`${kpi.label}: open ${kpi.opens}`}
                className="block focus:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
              >
                {cardLoading ? (
                  <div className="h-5 w-12 bg-muted animate-pulse rounded mb-1" />
                ) : (
                  <p className="text-lg font-bold text-foreground leading-tight tabular-nums">{kpi.value}</p>
                )}
                <p className="text-[11px] font-medium text-foreground/80 leading-tight truncate">{kpi.label}</p>
              </Link>
              {kpi.parts ? (
                <p className="relative z-10 text-[10px] text-muted-foreground leading-tight truncate">
                  {kpi.parts.map((part, i) => (
                    <span key={part.text}>
                      {i > 0 && " · "}
                      <Link
                        to={part.to}
                        onClick={() => scrollToAdminTabs(part.focus)}
                        className="underline-offset-2 hover:underline hover:text-foreground focus:outline-none focus-visible:underline"
                      >
                        {part.text}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : kpi.sublabel && (
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{kpi.sublabel}</p>
              )}
            </div>
            {kpi.sparkData && kpi.sparkData.length > 0 && !isLoading && (
              <div className="w-14 h-8 shrink-0 text-foreground" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.sparkData}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="currentColor"
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
          </>
        );
        return (
          <div key={kpi.label} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
});

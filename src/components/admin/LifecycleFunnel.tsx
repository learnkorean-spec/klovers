import { memo } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users, CreditCard, GraduationCap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFunnelCounts } from "@/hooks/admin/useFunnelCounts";
import { scrollToAdminTabs } from "@/lib/admin/scrollToAdminTabs";

interface FunnelProps {
  /**
   * @deprecated Ignored. The counts come from useFunnelCounts, which asks
   * Postgres for exact numbers instead of measuring fetched arrays.
   *
   * These props are still accepted because AdminDashboard.tsx passes them and
   * the tooling that produced this change cannot edit that file with a partial
   * diff. Remove them there and here in the same change.
   */
  leadsCount?: number;
  registeredCount?: number;
  enrolledCount?: number;
  activeCount?: number;
  completedCount?: number;

  pendingCount?: number;
  /**
   * @deprecated Ignored. Every card is now a link (see `to` below), and the
   * Enrolled card opens Enrollments whether or not anything is pending.
   */
  onPendingClick?: () => void;
}

/*
 * Each card opens the list behind its number. A count you cannot click into
 * sends you hunting through the tab rows for the same people.
 *
 * Colours are brand tokens only: klovers-green (a fill, charcoal on it) for
 * live students, klovers-yellow for the stage that usually needs a look, and
 * neutral for the rest.
 */
const stages = [
  { key: "leads", label: "Leads", icon: UserPlus, to: "/admin?tab=leads", opens: "Leads",
    accent: "bg-charcoal/60", light: "bg-muted", text: "text-foreground" },
  { key: "registered", label: "Registered", icon: Users, to: "/admin?tab=students&filter=all", opens: "all students",
    accent: "bg-charcoal/60", light: "bg-muted", text: "text-foreground" },
  // Enrolled and Active include private students (admin_funnel_overview, see
  // useFunnelCounts), who have no enrollment row — My students is the one
  // screen that lists both kinds.
  { key: "enrolled", label: "Enrolled", icon: CreditCard, to: "/admin?tab=my-students", opens: "My students",
    accent: "bg-klovers-yellow", light: "bg-klovers-yellow", text: "text-charcoal" },
  { key: "active", label: "Active", icon: GraduationCap, to: "/admin?tab=my-students", opens: "My students",
    accent: "bg-klovers-green", light: "bg-klovers-green", text: "text-charcoal" },
  { key: "completed", label: "Completed", icon: Award, to: "/admin?tab=students&filter=completed", opens: "the completed students",
    accent: "bg-charcoal/60", light: "bg-muted", text: "text-foreground" },
] as const;

const LifecycleFunnel = ({ pendingCount }: FunnelProps) => {
  const { data: counts, isLoading } = useFunnelCounts();

  /*
   * Denominator is Leads, the real top of the funnel.
   *
   * It used to be the LEAD status bucket — a slice INSIDE the funnel, smaller
   * than most of the numerators divided by it, which is how Registered came to
   * render as "102% of leads". The colour bar uses this percentage as a CSS
   * width, so anything over 100 overflowed its card too.
   *
   * Every profile matches a row in `leads`, so each stage below is a genuine
   * subset and the percentages are bounded at 100 by construction.
   */
  const total = Math.max(counts?.leads ?? 0, 1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stages.map((stage) => {
        const Icon = stage.icon;
        const isEnrolled = stage.key === "enrolled";
        const hasPending = isEnrolled && !!pendingCount && pendingCount > 0;
        const count = counts?.[stage.key];
        const pct = count === undefined ? 0 : Math.round((count / total) * 100);
        return (
          <Link
            key={stage.key}
            to={stage.to}
            onClick={() => scrollToAdminTabs()}
            aria-label={`${stage.label}: open ${stage.opens}`}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow"
          >
            <Card
              className={`h-full rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${hasPending ? "border-klovers-yellow" : ""}`}
            >
              <CardContent className="p-0">
                {/* Colour bar at top */}
                <div className={`h-1 ${stage.accent}`} style={{ width: `${pct}%`, minWidth: "8px", transition: "width 0.4s ease" }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`rounded-xl p-2 ${stage.light} shrink-0`}>
                      <Icon className={`h-4 w-4 ${stage.text}`} aria-hidden="true" />
                    </div>
                    {hasPending && (
                      <span className="text-[9px] font-bold bg-klovers-yellow text-charcoal rounded-full px-1.5 py-0.5 leading-none shrink-0">
                        +{pendingCount}
                      </span>
                    )}
                  </div>
                  {isLoading || count === undefined ? (
                    <div className="h-8 w-14 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-black text-foreground leading-none tabular-nums">{count}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                    {stage.label}
                  </p>
                  {/* Leads is the denominator; "100% of leads" under it says nothing. */}
                  {stage.key !== "leads" && count !== undefined && (
                    <p className="text-[10px] mt-0.5 font-semibold text-muted-foreground">{pct}% of leads</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default memo(LifecycleFunnel);

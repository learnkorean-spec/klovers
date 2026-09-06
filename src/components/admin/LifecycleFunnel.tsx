import { memo } from "react";
import { UserPlus, Users, CreditCard, GraduationCap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFunnelCounts } from "@/hooks/admin/useFunnelCounts";

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
  onPendingClick?: () => void;
}

const stages = [
  { key: "leads", label: "Leads", icon: UserPlus, accent: "bg-blue-500", light: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { key: "registered", label: "Registered", icon: Users, accent: "bg-blue-500", light: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { key: "enrolled", label: "Enrolled", icon: CreditCard, accent: "bg-amber-500", light: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  { key: "active", label: "Active", icon: GraduationCap, accent: "bg-green-500", light: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
  { key: "completed", label: "Completed", icon: Award, accent: "bg-primary", light: "bg-primary/10", text: "text-primary" },
] as const;

const LifecycleFunnel = ({ pendingCount, onPendingClick }: FunnelProps) => {
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
        const hasPending = isEnrolled && pendingCount && pendingCount > 0;
        const count = counts?.[stage.key];
        const pct = count === undefined ? 0 : Math.round((count / total) * 100);
        return (
          <Card
            key={stage.key}
            className={`rounded-2xl overflow-hidden transition-all ${hasPending ? "cursor-pointer border-amber-400/60 hover:border-amber-500 hover:shadow-md" : "hover:shadow-sm"}`}
            onClick={hasPending ? onPendingClick : undefined}
          >
            <CardContent className="p-0">
              {/* Color bar at top */}
              <div className={`h-1 ${stage.accent}`} style={{ width: `${pct}%`, minWidth: "8px", transition: "width 0.4s ease" }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`rounded-xl p-2 ${stage.light} shrink-0`}>
                    <Icon className={`h-4 w-4 ${stage.text}`} />
                  </div>
                  {hasPending && (
                    <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none shrink-0">
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
                  <p className={`text-[10px] mt-0.5 font-semibold ${stage.text}`}>{pct}% of leads</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default memo(LifecycleFunnel);

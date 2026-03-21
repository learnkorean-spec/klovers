import { UserPlus, Users, CreditCard, GraduationCap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FunnelProps {
  leadsCount: number;
  registeredCount: number;
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
  pendingCount?: number;
  onPendingClick?: () => void;
}

const stages = [
  { key: "leads", label: "Leads", icon: UserPlus, bgClass: "bg-blue-500/10", textClass: "text-blue-600" },
  { key: "registered", label: "Registered", icon: Users, bgClass: "bg-indigo-500/10", textClass: "text-indigo-600" },
  { key: "enrolled", label: "Enrolled", icon: CreditCard, bgClass: "bg-amber-500/10", textClass: "text-amber-600" },
  { key: "active", label: "Active", icon: GraduationCap, bgClass: "bg-emerald-500/10", textClass: "text-emerald-600" },
  { key: "completed", label: "Completed", icon: Award, bgClass: "bg-primary/10", textClass: "text-primary" },
];

const LifecycleFunnel = ({ leadsCount, registeredCount, enrolledCount, activeCount, completedCount, pendingCount, onPendingClick }: FunnelProps) => {
  const counts: Record<string, number> = {
    leads: leadsCount,
    registered: registeredCount,
    enrolled: enrolledCount,
    active: activeCount,
    completed: completedCount,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stages.map((stage) => {
        const Icon = stage.icon;
        const isEnrolled = stage.key === "enrolled";
        const hasPending = isEnrolled && pendingCount && pendingCount > 0;
        return (
          <Card
            key={stage.key}
            className={`rounded-2xl ${hasPending ? "cursor-pointer border-amber-400/60 hover:border-amber-500 transition-colors" : ""}`}
            onClick={hasPending ? onPendingClick : undefined}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${stage.bgClass} shrink-0`}>
                <Icon className={`h-5 w-5 ${stage.textClass}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-bold text-foreground leading-none">{counts[stage.key]}</p>
                  {hasPending && (
                    <span className="text-[10px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                      +{pendingCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stage.label}
                  {hasPending ? " · pending" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LifecycleFunnel;

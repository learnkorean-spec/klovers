import { UserPlus, Users, CreditCard, GraduationCap, Award } from "lucide-react";

interface FunnelProps {
  leadsCount: number;
  registeredCount: number;
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
}

const stages = [
  { key: "leads", label: "Leads", icon: UserPlus, bgClass: "bg-blue-500/10", textClass: "text-blue-600" },
  { key: "registered", label: "Registered", icon: Users, bgClass: "bg-indigo-500/10", textClass: "text-indigo-600" },
  { key: "enrolled", label: "Enrolled", icon: CreditCard, bgClass: "bg-amber-500/10", textClass: "text-amber-600" },
  { key: "active", label: "Active", icon: GraduationCap, bgClass: "bg-emerald-500/10", textClass: "text-emerald-600" },
  { key: "completed", label: "Completed", icon: Award, bgClass: "bg-primary/10", textClass: "text-primary" },
];

const LifecycleFunnel = ({ leadsCount, registeredCount, enrolledCount, activeCount, completedCount }: FunnelProps) => {
  const counts: Record<string, number> = {
    leads: leadsCount,
    registered: registeredCount,
    enrolled: enrolledCount,
    active: activeCount,
    completed: completedCount,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {stages.map((stage) => {
        const Icon = stage.icon;
        return (
          <div
            key={stage.key}
            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <div className={`rounded-full p-2 ${stage.bgClass} shrink-0`}>
              <Icon className={`h-4 w-4 ${stage.textClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground leading-none">{counts[stage.key]}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{stage.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LifecycleFunnel;

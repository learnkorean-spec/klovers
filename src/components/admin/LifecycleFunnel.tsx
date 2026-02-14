import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, CreditCard, GraduationCap, Award, ArrowRight } from "lucide-react";

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
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-5 uppercase tracking-wide">Student Lifecycle</h3>
        <div className="flex items-center justify-between gap-0">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center text-center flex-1 min-w-0 group">
                  <div className={`rounded-full p-2.5 ${stage.bgClass} mb-2 transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${stage.textClass}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground leading-none">{counts[stage.key]}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate w-full">{stage.label}</p>
                </div>
                {i < stages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LifecycleFunnel;

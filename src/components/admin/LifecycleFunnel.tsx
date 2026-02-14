import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, CreditCard, GraduationCap, Award } from "lucide-react";

interface FunnelProps {
  leadsCount: number;
  registeredCount: number;
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
}

const stages = [
  { key: "leads", label: "Leads", icon: UserPlus, color: "text-blue-500" },
  { key: "registered", label: "Registered", icon: Users, color: "text-indigo-500" },
  { key: "enrolled", label: "Enrolled", icon: CreditCard, color: "text-amber-500" },
  { key: "active", label: "Active", icon: GraduationCap, color: "text-emerald-500" },
  { key: "completed", label: "Completed", icon: Award, color: "text-primary" },
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
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Student Lifecycle</h3>
        <div className="flex items-center justify-between gap-1">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center gap-1 flex-1">
                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                  <Icon className={`h-5 w-5 ${stage.color} mb-1`} />
                  <p className="text-xl font-bold text-foreground">{counts[stage.key]}</p>
                  <p className="text-[10px] text-muted-foreground truncate w-full">{stage.label}</p>
                </div>
                {i < stages.length - 1 && (
                  <span className="text-muted-foreground/40 text-lg shrink-0">→</span>
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

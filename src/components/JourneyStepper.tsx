import { Check, UserPlus, BookOpen, GraduationCap, Award } from "lucide-react";

interface JourneyStepperProps {
  currentStage: number;
}

const stages = [
  { label: "Registered", icon: UserPlus },
  { label: "Enrolled", icon: BookOpen },
  { label: "Active", icon: GraduationCap },
  { label: "Completed", icon: Award },
];

const JourneyStepper = ({ currentStage }: JourneyStepperProps) => {
  return (
    <div className="flex items-center w-full">
      {stages.map((stage, i) => {
        const isCompleted = i < currentStage;
        const isCurrent = i === currentStage;
        const Icon = stage.icon;
        return (
          <div key={stage.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-primary-foreground shadow-md border-2 border-foreground/20"
                    : isCurrent
                    ? "border-2 border-primary text-foreground bg-primary/20 shadow-sm"
                    : "border-2 border-muted text-muted-foreground bg-muted/30"
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  isCurrent ? "font-semibold text-foreground" : isCompleted ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 mx-2 h-1 rounded-full overflow-hidden bg-muted border border-border">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-primary border border-foreground/10 w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default JourneyStepper;

import { Check } from "lucide-react";

interface JourneyStepperProps {
  currentStage: number; // 0-based index
}

const stages = [
  { label: "Registered" },
  { label: "Enrolled" },
  { label: "Active" },
  { label: "Completed" },
];

const JourneyStepper = ({ currentStage }: JourneyStepperProps) => {
  return (
    <div className="flex items-center w-full gap-0">
      {stages.map((stage, i) => {
        const isCompleted = i < currentStage;
        const isCurrent = i === currentStage;
        return (
          <div key={stage.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary text-primary bg-primary/10"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 whitespace-nowrap ${
                  isCurrent ? "font-semibold text-primary" : isCompleted ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default JourneyStepper;

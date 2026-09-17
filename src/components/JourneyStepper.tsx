import { Check, UserPlus, BookOpen, GraduationCap, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface JourneyStepperProps {
  currentStage: number;
}

const stages = [
  { key: "journeyRegistered", icon: UserPlus },
  { key: "journeyEnrolled", icon: BookOpen },
  { key: "journeyActive", icon: GraduationCap },
  { key: "journeyCompleted", icon: Award },
];

const JourneyStepper = ({ currentStage }: JourneyStepperProps) => {
  const { t } = useLanguage();
  return (
    <ol className="flex items-start w-full min-w-0">
      {stages.map((stage, i) => {
        const isCompleted = i < currentStage;
        const isCurrent = i === currentStage;
        const Icon = stage.icon;
        return (
          <li key={stage.key} className="flex items-start flex-1 last:flex-none min-w-0" aria-current={isCurrent ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
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
                className={`text-[11px] sm:text-xs leading-tight text-center sm:whitespace-nowrap px-1.5 sm:px-2 py-0.5 rounded-full ${
                  isCurrent ? "font-semibold bg-primary text-primary-foreground" : isCompleted ? "font-medium bg-primary/20 text-foreground border border-primary/40" : "text-muted-foreground"
                }`}
              >
                {t(`dashboardPage.${stage.key}`)}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div aria-hidden="true" className="flex-1 min-w-2 mx-1 sm:mx-2 mt-4 sm:mt-5 h-1 rounded-full overflow-hidden bg-muted border border-border">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-primary border border-foreground/10 w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default JourneyStepper;

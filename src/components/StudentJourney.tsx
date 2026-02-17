import { useLanguage } from "@/contexts/LanguageContext";
import { UserPlus, ClipboardList, CreditCard, GraduationCap, Users, Award } from "lucide-react";

const steps = [
  { icon: UserPlus, labelEn: "Visit & Explore", labelAr: "اكتشف الموقع" },
  { icon: ClipboardList, labelEn: "Register", labelAr: "سجّل حسابك" },
  { icon: CreditCard, labelEn: "Enroll & Pay", labelAr: "سجّل وادفع" },
  { icon: Users, labelEn: "Join Your Group", labelAr: "انضم لمجموعتك" },
  { icon: GraduationCap, labelEn: "Start Learning", labelAr: "ابدأ التعلم" },
  { icon: Award, labelEn: "Graduate!", labelAr: "تخرّج!" },
];

const StudentJourney = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isAr ? "رحلتك معنا" : "Your Learning Journey"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isAr ? "من الزيارة الأولى حتى التخرج — خطوة بخطوة" : "From your first visit to graduation — step by step"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 max-w-4xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-2 md:flex-col md:gap-0 md:flex-1">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-2 border-2 border-foreground/20 shadow-sm">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{isAr ? step.labelAr : step.labelEn}</span>
                </div>
                {i < steps.length - 1 && (
                  <span className="hidden md:block text-muted-foreground/40 text-2xl mt-[-1.5rem]">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StudentJourney;

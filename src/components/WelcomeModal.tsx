import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Gamepad2, BookOpen, X, ChevronRight } from "lucide-react";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { useLanguage } from "@/contexts/LanguageContext";

const STEPS = [
  {
    icon: ClipboardCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    titleEn: "Take Your Placement Test",
    titleAr: "اختبار المستوى",
    // Was: "Find out your exact Korean level (A1–C2)". The quiz measures
    // neither CEFR nor anything exactly — it is thirty questions that suggest
    // where to start. Promise that instead, in the level names the rest of the
    // site uses.
    descEn: "See which level to start from (Hangul, or Level 1 to 6) with our free placement quiz. It only takes 10 minutes.",
    descAr: "اختبار تحديد المستوى المجاني يوضّح نقطة البداية: تأسيس الهانغول، أو أحد المستويات من الأول حتى السادس. ١٠ دقائق فقط.",
    cta: "/placement-test",
    ctaEn: "Take Free Test",
    ctaAr: "بدء الاختبار",
  },
  {
    icon: BookOpen,
    color: "text-green-500",
    bg: "bg-green-500/10",
    titleEn: "Explore Your Textbook",
    titleAr: "استكشاف الكتاب المدرسي",
    descEn: "Browse 75+ structured Korean lessons organised by level. Study vocabulary, grammar, and culture at your pace.",
    descAr: "أكثر من ٧٥ درسًا كوريًا مرتّبة حسب المستوى: المفردات والقواعد والثقافة، بالوتيرة المناسبة لكل طالب.",
    cta: "/textbook",
    ctaEn: "Open Textbook",
    ctaAr: "فتح الكتاب",
  },
  {
    icon: Gamepad2,
    color: "text-primary",
    bg: "bg-primary/10",
    titleEn: "Play & Earn XP",
    titleAr: "ألعاب ونقاط",
    descEn: "13 interactive games to practise Korean: every game you play earns XP and unlocks badges. Learning is fun!",
    descAr: "١٣ لعبة تفاعلية لتدريب الكورية، كل لعبة تمنح نقاطًا وتفتح شارات.",
    cta: "/games",
    ctaEn: "Play Games",
    ctaAr: "اللعب الآن",
  },
];

const STORAGE_KEY = "klovers-onboarding-done";

export const markOnboardingDone = () => localStorage.setItem(STORAGE_KEY, "1");
export const isOnboardingDone = () => Boolean(localStorage.getItem(STORAGE_KEY));

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const handleClose = () => {
    markOnboardingDone();
    onClose();
  };

  const handleCta = (href: string) => {
    markOnboardingDone();
    onClose();
    navigate(href);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl" aria-describedby="welcome-desc">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-8 pb-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-3 end-3 h-7 w-7 rounded-full bg-primary-foreground/15 flex items-center justify-center hover:bg-primary-foreground/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="h-4 w-4 text-primary-foreground" />
          </button>

          {/* A neutral icon on an Ivory dome: a brand-new student has not met
              Cluby yet (he appears once his egg hatches), so no character here.
              On the yellow header the drawing needs a light surface (palette rule). */}
          <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-ivory border border-charcoal/20 items-center justify-center mb-2 sm:mb-3">
            <BrandIcon name="open-book" className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
          {/* No 🇰🇷 emoji here. Windows and most Linux desktops ship no colour
              flag font, so the emoji draws as the bare letters "KR" beside the
              wordmark — it reads as a typo, not as a flag. The illustrated flag
              from the icon set is the same mark at every size on every platform,
              and at 24px only the flag itself is legible, which is the point. */}
          <h2 className="text-xl font-extrabold text-primary-foreground mb-1">
            {isAr ? "أهلًا بك في كلوفرز!" : "Welcome to Klovers!"}
            <img
              src="/assets/icons/flag-korea.webp"
              srcSet="/assets/icons/flag-korea@2x.webp 2x"
              alt=""
              aria-hidden="true"
              width={48}
              height={48}
              className="ms-1.5 inline-block h-6 w-6 align-[-0.25em]"
            />
          </h2>
          <p className="text-primary-foreground/80 text-sm">
            {isAr ? "إليك كيف تبدأ رحلتك الكورية" : "Here's how to kick off your Korean journey"}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={isAr ? `الخطوة ${i + 1} من ${STEPS.length}` : `Step ${i + 1} of ${STEPS.length}`}
                aria-current={i === step ? "step" : undefined}
                className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl ${current.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-6 w-6 ${current.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base leading-tight mb-1.5">
                {isAr ? current.titleAr : current.titleEn}
              </h3>
              <p id="welcome-desc" className="text-muted-foreground text-sm leading-relaxed">
                {isAr ? current.descAr : current.descEn}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleCta(current.cta)}
              className="flex-1 gap-1.5 h-10"
            >
              {isAr ? current.ctaAr : current.ctaEn}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
            <Button variant="outline" onClick={handleNext} className="h-10 px-4 text-sm">
              {step < STEPS.length - 1
                ? (isAr ? "التالي" : "Next")
                : (isAr ? "تم" : "Done")}
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {isAr ? "تخطي جولة الترحيب" : "Skip welcome tour"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;

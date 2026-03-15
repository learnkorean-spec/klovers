import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Star, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const SOCIAL_PROOF = [
  { icon: Users, value: "2,000+", label: "Students" },
  { icon: Star,  value: "4.9★",   label: "Rating" },
  { icon: Zap,   value: "45",      label: "Lessons" },
];

const FinalCTA = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-16 md:py-24 bg-primary relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-primary-foreground/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-foreground/3 rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-primary-foreground/15 border border-primary-foreground/20 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          {isAr ? "ابدأ رحلتك الكورية" : "Start Your Korean Journey"}
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
          {t("finalCta", "title")}
        </h2>
        <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-base md:text-lg">
          {t("finalCta", "subtitle")}
        </p>

        {/* Social proof row */}
        <div className="flex items-center justify-center gap-6 flex-wrap mb-10">
          {SOCIAL_PROOF.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary-foreground/70" />
              <div className="text-left">
                <p className="font-bold text-primary-foreground text-sm leading-none">{value}</p>
                <p className="text-xs text-primary-foreground/65">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Button size="lg" variant="secondary" asChild className="gap-2 h-12 px-8 text-base shadow-lg min-w-[180px]">
            <Link to="/enroll-now">
              {t("finalCta", "button")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2 h-12 px-8 text-base bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 min-w-[180px]">
            <Link to="/placement-test">
              {isAr ? "اختبار مجاني" : "Free Placement Test"}
            </Link>
          </Button>
        </div>

        <p className="text-primary-foreground/50 text-xs mt-5">
          {isAr ? "لا يلزم بطاقة ائتمان • إلغاء في أي وقت" : "No credit card required • Cancel anytime"}
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;

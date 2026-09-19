import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Star, Globe, MessageCircle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";

/**
 * The same three facts as the hero strip, and for the same reason.
 *
 * This block used to read "500+ / Active Students", "4.9★ / Average Rating",
 * "98% / Would Recommend" — on the same page whose hero says "200+ / Students
 * in 13 years". A visitor who scrolls the homepage was handed two different
 * student counts by the same business, which costs more credibility than
 * either number buys.
 *
 * Each figure and why it reads the way it does:
 *
 * - 200+, not 500+. It counts every student Re has taught across 13 years,
 *   not accounts on this platform, so the LABEL carries the scope and is part
 *   of the claim. "Active Students" was worse than the number: production
 *   holds 5 rows in teacher_students and 7 bundles. Nothing supports
 *   "active" at any figure.
 * - The rating and its count come from the GOOGLE Business Profile, checked
 *   signed-in as the owner on 2026-09-18: 5.0 from 7 reviews. It used to say
 *   "4.9 / Average Rating" with no source, and 4.9 was not a number either
 *   platform showed. Facebook's own metric - 100% recommend, from 20 reviews
 *   - lives in TestimonialsSection, the section that links to that page.
 *   A percentage and a five-point scale are never averaged together.
 * - "98% Would Recommend" is gone rather than corrected. `student_nps` has
 *   ZERO rows — nothing in the product has ever asked the question, so there
 *   was no true number to replace it with. A1–C2 takes its place because it
 *   is simply the level range taught.
 *
 * Labels are now bilingual. All three were English-only on an Arabic-first
 * site, so an Arabic reader got "Active Students" under a Korean-course
 * heading in her own language.
 *
 * 2026-09-20: the student figure no longer counts up from zero. Same reason
 * the rating never did — every frame of the animation renders a number the
 * business does not claim. HeroSection.tsx made the same change; if one of
 * these three facts changes, the other file has to change with it.
 */
const SOCIAL_PROOF = [
  { icon: Users, value: "200+", en: "Students in 13 years", ar: "طالب خلال ١٣ عاماً" },
  { icon: Star, value: "5.0 ★", en: "From 7 Google reviews", ar: "من ٧ مراجعات جوجل" },
  { icon: Globe, value: "A1–C2", en: "All Levels", ar: "جميع المستويات" },
];

// Floating Korean characters for visual texture
const KR_CHARS = ["안녕", "한국어", "공부", "화이팅", "수업", "최고"];

const FinalCTA = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden bg-primary border-y border-charcoal/25"
    >
      {/* Top edge gradient for depth */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />

      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {KR_CHARS.map((char, i) => (
          <span
            key={char}
            className="absolute text-4xl md:text-6xl font-extrabold text-primary-foreground/5"
            style={{
              top: `${10 + (i % 3) * 30}%`,
              left: `${5 + i * 15}%`,
              transform: `rotate(${-20 + i * 10}deg)`,
            }}
          >
            {char}
          </span>
        ))}
        {/* Gradient blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary-foreground/5 rounded-full" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">

        {/* Label pill */}
        <div
          className={`inline-flex items-center gap-2 bg-primary-foreground/15 border border-primary-foreground/25 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold mb-6 transition-all duration-700 ${
            visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {isAr ? "ابدأ رحلتك الكورية اليوم" : "Start Your Korean Journey Today"}
        </div>

        {/* Headline */}
        <h2
          className={`text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-5 leading-tight transition-all duration-700 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {t("finalCta", "title")}
        </h2>

        <p
          className={`text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-base md:text-lg leading-relaxed transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {t("finalCta", "subtitle")}
        </p>

        {/* Social proof — static, see the block comment above */}
        <div
          className={`flex items-center justify-center gap-4 flex-wrap mb-10 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {SOCIAL_PROOF.map(({ icon: Icon, value, en, ar }) => {
            const label = isAr ? ar : en;
            return (
              <div key={en} className="flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/15 rounded-xl px-4 py-2.5">
                <Icon className="h-5 w-5 text-primary-foreground/70" />
                <div className="text-start">
                  <p className="font-bold text-primary-foreground text-sm leading-none">{value}</p>
                  <p className="text-[11px] text-primary-foreground/60">{label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ONE action.

            This row used to hold three equally sized buttons - free trial,
            placement test, and a WhatsApp button in its own brand green on a
            yellow ground. Three primary-looking choices is the choice
            paralysis the board and the direction deck both rule out, and the
            green on yellow was the loudest colour pairing on the page.

            The other two are still here, as links. Same destinations, same
            cta_labels, so nothing tracked changes. */}
        <div
          className={`flex flex-col items-center gap-5 mb-6 transition-all duration-700 delay-400 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="gap-2 h-13 px-10 text-base shadow-xl min-w-[240px] font-bold rounded-full"
            onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "final_cta_free_trial" }); } catch {} }}
          >
            <Link to="/free-trial">
              {t("hero", "startNow")}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/placement-test"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/80 underline decoration-primary-foreground/30 underline-offset-4 transition-colors hover:text-primary-foreground hover:decoration-primary-foreground/60"
            >
              <ClipboardCheck className="h-4 w-4" />
              {isAr ? "أو حدد مستواك مجانًا" : "or take the free placement test"}
            </Link>
            <a
              href={WHATSAPP_BASE}
              onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "final_cta_homepage" }); }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/80 underline decoration-primary-foreground/30 underline-offset-4 transition-colors hover:text-primary-foreground hover:decoration-primary-foreground/60"
            >
              <MessageCircle className="h-4 w-4" />
              {isAr ? "أو كلّمنا على واتساب" : "or talk to us on WhatsApp"}
            </a>
          </div>
        </div>

        <p className="text-primary-foreground/60 text-xs mb-6">
          {isAr ? "لا بطاقة ائتمان · ٣٠ دقيقة · معلمة حقيقية · نرد خلال دقائق" : "No credit card · 30 minutes · Real teacher · We reply in minutes"}
        </p>

        {/* Community proof — FOLLOWERS, not students, which is why it does not
            contradict the 200+ tile above it.

            Removed earlier on 2026-09-18 on the understanding that the real
            figure was 200, then restored the same day after checking the
            platforms: the Facebook page shows 2.4K followers and Google lists
            it at 4K+, so 2,000+ across Telegram and Facebook is conservative.
            If it is ever raised, raise it against a number someone has just
            looked at. */}
        <p className="text-primary-foreground/60 text-xs mb-4">
          {isAr
            ? "🌍 انضم لأكثر من ٢٠٠٠ متعلم في مجتمعنا على تيليجرام وفيسبوك"
            : "🌍 Join 2,000+ Korean learners in our Telegram & Facebook community"}
        </p>

        {/* Guarantee badge */}
        <div className="inline-flex items-center gap-3 bg-primary-foreground/10 border border-primary-foreground/20 rounded-2xl px-5 py-3">
          <span className="text-2xl" aria-hidden="true">🛡️</span>
          <div className="text-start">
            <p className="text-primary-foreground font-bold text-sm leading-tight">
              {isAr ? "ضمان الرضا الكامل" : "Satisfaction Guarantee"}
            </p>
            <p className="text-primary-foreground/70 text-xs mt-0.5">
              {isAr ? "إذا ما عجبتكش الحصة الأولى — هنرجعلك فلوسك أو نعيد الحجز." : "If your first class isn't great, we refund or rebook — no questions asked."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

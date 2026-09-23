import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Star, Globe, MessageCircle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import PriceTeaser from "@/components/PriceTeaser";

/**
 * The last ask on the homepage.
 *
 * 23 Sep 2026, CRO pass:
 *  - The heading was "One Free Class. That's All We Ask." (translations.ts
 *    `finalCta.title`) - an obligation frame. It is an invitation now,
 *    written here in both languages.
 *  - The three facts use the same labels as the rest of the page: 200+ is the
 *    students Reham has taught herself; the Google rating keeps its source.
 *  - The community tile says "social media community", matching the band -
 *    2,000+ counts followers, never students.
 *  - The real price teaser sits under the button (PriceTeaser.tsx).
 *  - The satisfaction-guarantee wording is unchanged: wording a policy is
 *    Re's call, not a copy edit.
 *  - The two quiet links are 44px tap targets (they measured 20px at 375px).
 *
 * Numbers are static on purpose: a count-up renders every intermediate value
 * as a finished claim.
 */
const SOCIAL_PROOF = [
  { icon: Users, value: "200+", en: "Students taught by Reham", ar: "طالب درّستهم ريهام" },
  { icon: Star, value: "5.0 ★", en: "From 7 Google reviews", ar: "من ٧ مراجعات جوجل" },
  { icon: Globe, value: "EN · AR", en: "Classes in English or Arabic", ar: "حصص بالعربي أو الإنجليزي" },
];

const CAST: { name: KloverIconName; delay: string; cls: string }[] = [
  { name: "student-girl-heart", delay: "0.4s", cls: "" },
  { name: "klobi-headphones", delay: "0s", cls: "" },
  { name: "student-boy-thumbsup", delay: "0.8s", cls: "hidden sm:block" },
];

const KR_CHARS = ["안녕", "한국어", "공부", "화이팅", "수업", "최고"];

const QUIET_LINK =
  "inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ivory/85 underline decoration-ivory/30 underline-offset-4 transition-colors hover:text-ivory hover:decoration-ivory/60";

const FinalCTA = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  // Starts visible: the heading and the button must never wait on an observer.
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const reveal = (delay: string) =>
    `transition-all duration-700 ${delay} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`;

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden bg-primary border-y border-charcoal/25"
    >
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {KR_CHARS.map((char, i) => (
          <span
            key={char}
            className="absolute font-ko-hand text-5xl md:text-7xl font-normal text-charcoal/[0.06]"
            style={{
              top: `${8 + (i % 3) * 32}%`,
              left: `${3 + i * 12}%`,
              transform: `rotate(${-18 + i * 8}deg)`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">

        <div className={`relative mx-auto max-w-4xl pt-24 md:pt-28 ${reveal("")}`}>

          <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
            <Sparkles className="animate-drift absolute start-2 top-10 h-5 w-5 text-charcoal/30" style={{ animationDelay: "0s" }} />
            <Sparkles className="animate-drift absolute end-1/3 top-2 h-4 w-4 text-charcoal/25" style={{ animationDelay: "1.1s" }} />
            <Sparkles className="animate-drift absolute -end-1 bottom-24 h-6 w-6 text-charcoal/25" style={{ animationDelay: "0.6s" }} />
          </div>

          <div className="pointer-events-none absolute start-6 top-0 z-10 flex items-end gap-2 [perspective:500px] md:start-10" aria-hidden="true">
            {CAST.map(({ name, delay, cls }) => (
              <div key={name} className={`relative h-24 w-24 md:h-28 md:w-28 ${cls}`}>
                <span className="absolute inset-x-1 bottom-0 h-1/2 rounded-t-full border-2 border-b-0 border-charcoal bg-ivory" />
                <div className="animate-bar-jump absolute inset-0 origin-bottom" style={{ animationDelay: delay }}>
                  <KloverIcon name={name} className="h-full w-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="animate-stamp absolute -end-2 top-14 z-20 grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-klovers-yellow bg-charcoal text-center shadow-lg md:-end-5 md:top-16 md:h-24 md:w-24" aria-hidden="true">
            <span>
              <span className="block text-xl font-extrabold leading-none text-klovers-yellow md:text-2xl">{isAr ? "مجاناً" : "FREE"}</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-ivory">{isAr ? "أول حصة" : "1st class"}</span>
            </span>
          </div>

          <div className="card-edge relative grid overflow-hidden rounded-3xl bg-charcoal transition-transform duration-300 md:grid-cols-[13rem_1fr] md:hover:-rotate-[0.6deg]">

            {/* Stub */}
            <div className="relative flex flex-row items-center justify-center gap-4 bg-klovers-yellow px-6 py-6 text-charcoal md:flex-col md:gap-1 md:py-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] md:mb-1">{isAr ? "تذكرة دخول" : "Admit one"}</p>
              <p className="font-display text-6xl font-extrabold leading-none md:text-7xl">{isAr ? "٣٠" : "30"}</p>
              <div className="text-start md:text-center">
                <p className="text-sm font-extrabold uppercase tracking-wide">{isAr ? "دقيقة" : "minutes"}</p>
                <p className="text-xs font-bold uppercase tracking-wide">{isAr ? "حصة مجانية" : "free class"}</p>
              </div>

              <span aria-hidden="true" className="absolute inset-x-6 bottom-0 border-b-2 border-dashed border-charcoal/40 md:inset-x-auto md:inset-y-6 md:end-0 md:border-b-0 md:border-e-2" />
              <span aria-hidden="true" className="absolute -bottom-3 start-[-0.75rem] h-6 w-6 rounded-full bg-primary md:bottom-auto md:start-auto md:-top-3 md:end-[-0.75rem]" />
              <span aria-hidden="true" className="absolute -bottom-3 end-[-0.75rem] h-6 w-6 rounded-full bg-primary md:-bottom-3 md:end-[-0.75rem]" />
            </div>

            {/* Body */}
            <div className="px-6 py-8 text-center md:px-10 md:py-10 md:text-start">
              <h2 className="text-3xl font-extrabold leading-tight text-ivory md:text-4xl lg:text-5xl">
                {isAr ? "جاهز تبدأ رحلتك مع الكورية؟" : "Ready to Start Your Korean Journey?"}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ivory/75 md:text-lg">
                {isAr
                  ? "أول حصة مجانية. اتعرّف على معلمتك، وشوف الحصة ماشية إزاي، وبعدين قرّر إذا كانت كلوفرز مناسبة ليك."
                  : "Your first class is free. Meet your teacher, see how the class works, and decide if Klovers is right for you."}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start">
                {SOCIAL_PROOF.map(({ icon: Icon, value, en, ar }) => (
                  <div key={en} className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-klovers-yellow" aria-hidden="true" />
                    <div className="text-start">
                      <p className="text-sm font-extrabold leading-none text-ivory" dir="ltr">{value}</p>
                      <p className="mt-0.5 text-[11px] text-ivory/65">{isAr ? ar : en}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col items-center gap-4 md:items-start">
                <Button
                  size="lg"
                  asChild
                  className="h-13 min-w-[240px] gap-2 rounded-full px-10 text-base font-bold"
                  onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "final_cta_free_trial", metadata: { language } }); } catch {} }}
                >
                  <Link to="/free-trial">
                    {isAr ? "احجز حصتك المجانية" : "Book Your Free Class"}
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </Link>
                </Button>

                <PriceTeaser source="final_cta" className="!text-ivory/70 [&_strong]:!text-ivory [&_a]:!text-ivory [&_a]:!decoration-ivory/40" />

                <div className="flex flex-wrap items-center justify-center gap-x-6 md:justify-start">
                  <Link to="/placement-test" className={QUIET_LINK}>
                    <ClipboardCheck className="h-4 w-4" />
                    {isAr ? "أو حدّد مستواك مجانًا" : "or take the free placement test"}
                  </Link>
                  <a
                    href={WHATSAPP_BASE}
                    onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "final_cta_homepage" }); }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={QUIET_LINK}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {isAr ? "أو كلّمنا على واتساب" : "or message us on WhatsApp"}
                  </a>
                </div>

                <p className="text-xs text-ivory/60">
                  {isAr ? "بدون بطاقة بنكية · ٣٠ دقيقة · معلمة حقيقية" : "No credit card · 30 minutes · A real teacher"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2 ${reveal("delay-300")}`}>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-charcoal bg-ivory px-5 py-4 text-start">
            <span className="text-3xl" aria-hidden="true">🛡️</span>
            <div>
              <p className="text-sm font-extrabold leading-tight text-charcoal">
                {isAr ? "ضمان الرضا الكامل" : "Satisfaction Guarantee"}
              </p>
              <p className="mt-0.5 text-xs text-charcoal/75">
                {isAr ? "إذا ما عجبتكش الحصة الأولى — هنرجعلك فلوسك أو نعيد الحجز." : "If your first class isn't great, we refund or rebook — no questions asked."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border-2 border-charcoal bg-ivory px-5 py-4 text-start">
            <span className="text-3xl" aria-hidden="true">🌍</span>
            <p className="text-sm font-bold leading-snug text-charcoal">
              {isAr
                ? "انضم لأكثر من ٢٠٠٠ متابع في مجتمعنا على السوشيال ميديا"
                : "Join 2,000+ people in our social media community"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

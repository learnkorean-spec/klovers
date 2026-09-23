import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Star, Globe, MessageCircle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
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
 * 24 Sep 2026: THE SCENE. The yellow band, the three bouncing flat characters
 * and the handwritten texture gave way to one painted scene: Cluby on a hill
 * pointing at the Seoul skyline at sunset. The picture meets the page at both
 * edges (gradients from and to the page background), the heading sits in the
 * empty sky, and the ticket overlaps the bottom fade. The phone gets its own
 * 4:5 crop with more sky. The aspect ratio is fixed per breakpoint so the
 * heading's percentage offset lands in the sky before the image loads.
 *
 * Numbers are static on purpose: a count-up renders every intermediate value
 * as a finished claim.
 */
const SOCIAL_PROOF = [
  { icon: Users, value: "200+", en: "Students taught by Reham", ar: "طالب درّستهم ريهام" },
  { icon: Star, value: "5.0 ★", en: "From 7 Google reviews", ar: "من ٧ مراجعات جوجل" },
  { icon: Globe, value: "EN · AR", en: "Classes in English or Arabic", ar: "حصص بالعربي أو الإنجليزي" },
];

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
      className="relative overflow-hidden bg-background pb-20 md:pb-28"
    >
      {/* ── The scene: Cluby pointing at Seoul, heading in the sky ── */}
      <div className="relative">
        <picture>
          <source media="(max-width: 767px)" srcSet="/assets/cluby/cta-mobile.webp" />
          <img
            src="/assets/cluby/cta.webp"
            alt={isAr ? "كلوبي على تلّة بيشاور على أفق سيول وقت الغروب" : "Cluby on a hill pointing at the Seoul skyline at sunset"}
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            className="block aspect-[4/5] w-full object-cover md:aspect-[16/9]"
          />
        </picture>

        {/* The page flows into the sky, and the hill flows back into the page. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-background to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-background to-transparent" />

        <div className={`absolute inset-x-0 top-[11%] px-4 text-center md:top-[8%] ${reveal("")}`}>
          <h2
            className="mx-auto max-w-3xl text-[1.75rem] font-extrabold leading-tight text-charcoal sm:text-3xl lg:text-5xl"
            style={{ textShadow: "0 1px 14px rgba(255,249,236,0.65)" }}
          >
            {isAr ? "جاهز تبدأ رحلتك مع الكورية؟" : "Ready to Start Your Korean Journey?"}
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-charcoal/80 lg:text-lg"
            style={{ textShadow: "0 1px 10px rgba(255,249,236,0.6)" }}
          >
            {isAr
              ? "أول حصة مجانية. اتعرّف على معلمتك، وشوف الحصة ماشية إزاي، وبعدين قرّر إذا كانت كلوفرز مناسبة ليك."
              : "Your first class is free. Meet your teacher, see how the class works, and decide if Klovers is right for you."}
          </p>
        </div>
      </div>

      <div className="container relative z-10 mx-auto -mt-12 px-4 sm:-mt-20 md:-mt-28 lg:-mt-32">

        <div className={`relative mx-auto max-w-4xl ${reveal("")}`}>

          <div className="animate-stamp absolute -end-2 -top-8 z-20 grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-klovers-yellow bg-charcoal text-center shadow-lg md:-end-5 md:-top-10 md:h-24 md:w-24" aria-hidden="true">
            <span>
              <span className="block text-xl font-extrabold leading-none text-klovers-yellow md:text-2xl">{isAr ? "مجاناً" : "FREE"}</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-ivory">{isAr ? "أول حصة" : "1st class"}</span>
            </span>
          </div>

          <div className="card-edge relative grid overflow-hidden rounded-3xl bg-charcoal shadow-[0_24px_60px_-30px_rgba(46,46,46,0.8)] transition-transform duration-300 md:grid-cols-[13rem_1fr] md:hover:-rotate-[0.6deg]">

            {/* Stub */}
            <div className="relative flex flex-row items-center justify-center gap-4 bg-klovers-yellow px-6 py-6 text-charcoal md:flex-col md:gap-1 md:py-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] md:mb-1">{isAr ? "تذكرة دخول" : "Admit one"}</p>
              <p className="font-display text-6xl font-extrabold leading-none md:text-7xl">{isAr ? "٣٠" : "30"}</p>
              <div className="text-start md:text-center">
                <p className="text-sm font-extrabold uppercase tracking-wide">{isAr ? "دقيقة" : "minutes"}</p>
                <p className="text-xs font-bold uppercase tracking-wide">{isAr ? "حصة مجانية" : "free class"}</p>
              </div>

              <span aria-hidden="true" className="absolute inset-x-6 bottom-0 border-b-2 border-dashed border-charcoal/40 md:inset-x-auto md:inset-y-6 md:end-0 md:border-b-0 md:border-e-2" />
              <span aria-hidden="true" className="absolute -bottom-3 start-[-0.75rem] h-6 w-6 rounded-full bg-background md:bottom-auto md:start-auto md:-top-3 md:end-[-0.75rem]" />
              <span aria-hidden="true" className="absolute -bottom-3 end-[-0.75rem] h-6 w-6 rounded-full bg-background md:-bottom-3 md:end-[-0.75rem]" />
            </div>

            {/* Body */}
            <div className="px-6 py-8 text-center md:px-10 md:py-10 md:text-start">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start">
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

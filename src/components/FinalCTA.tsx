import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Star, Globe, MessageCircle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";

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

// Big ghost Korean words behind the ticket, for texture. Charcoal at 6% on the
// yellow ground: present, never competing with type.
// The cast that welcomes people to the ticket. Klobi and the girl stand on the
// ticket's top edge, each on an Ivory dome (their outlines vanish on Yellow, so
// they never stand on it directly), and hop on staggered beats.
const CAST: { name: KloverIconName; delay: string; cls: string }[] = [
  { name: "student-girl-heart", delay: "0.4s", cls: "" },
  { name: "klobi-headphones", delay: "0s", cls: "" },
  { name: "student-boy-thumbsup", delay: "0.8s", cls: "hidden sm:block" },
];

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

  const reveal = (delay: string) =>
    `transition-all duration-700 ${delay} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`;

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden bg-primary border-y border-charcoal/25"
    >
      {/* Ghost Korean words */}
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

        {/* ── THE TICKET ─────────────────────────────────────────────────
            The offer is one free class, so the block is drawn as a ticket to
            it: a yellow stub with the number that matters, a perforation with
            a notch top and bottom, and the pitch on the Charcoal body. It
            replaces a flat yellow page of olive-grey small print (Charcoal at
            60-80% on Yellow reads as mud); every line of type here is either
            full Charcoal on Yellow or Ivory on Charcoal. */}
        <div className={`relative mx-auto max-w-4xl pt-24 md:pt-28 ${reveal("")}`}>

          {/* Drifting sparkles: small, Charcoal at low strength, decorative. */}
          <div className="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
            <Sparkles className="animate-drift absolute start-2 top-10 h-5 w-5 text-charcoal/30" style={{ animationDelay: "0s" }} />
            <Sparkles className="animate-drift absolute end-1/3 top-2 h-4 w-4 text-charcoal/25" style={{ animationDelay: "1.1s" }} />
            <Sparkles className="animate-drift absolute -end-1 bottom-24 h-6 w-6 text-charcoal/25" style={{ animationDelay: "0.6s" }} />
          </div>

          {/* The cast, standing on the ticket's top edge */}
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

          {/* The stamp: FREE, slightly crooked and wobbling, on the ticket's corner */}
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

              {/* Perforation and its two notches, in the section's own colour
                  so they read as bites out of the ticket. */}
              <span aria-hidden="true" className="absolute inset-x-6 bottom-0 border-b-2 border-dashed border-charcoal/40 md:inset-x-auto md:inset-y-6 md:end-0 md:border-b-0 md:border-e-2" />
              <span aria-hidden="true" className="absolute -bottom-3 start-[-0.75rem] h-6 w-6 rounded-full bg-primary md:bottom-auto md:start-auto md:-top-3 md:end-[-0.75rem]" />
              <span aria-hidden="true" className="absolute -bottom-3 end-[-0.75rem] h-6 w-6 rounded-full bg-primary md:-bottom-3 md:end-[-0.75rem]" />
            </div>

            {/* Body */}
            <div className="px-6 py-8 text-center md:px-10 md:py-10 md:text-start">
              <h2 className="text-3xl font-extrabold leading-tight text-ivory md:text-4xl lg:text-5xl">
                {t("finalCta", "title")}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ivory/75 md:text-lg">
                {t("finalCta", "subtitle")}
              </p>

              {/* Social proof — static, see the block comment above */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start">
                {SOCIAL_PROOF.map(({ icon: Icon, value, en, ar }) => (
                  <div key={en} className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-klovers-yellow" aria-hidden="true" />
                    <div className="text-start">
                      <p className="text-sm font-extrabold leading-none text-ivory">{value}</p>
                      <p className="mt-0.5 text-[11px] text-ivory/65">{isAr ? ar : en}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ONE action.

                  This row used to hold three equally sized buttons - free
                  trial, placement test, and a WhatsApp button in its own brand
                  green on a yellow ground. Three primary-looking choices is the
                  choice paralysis the board and the direction deck both rule
                  out. The other two are links; same destinations, same
                  cta_labels, so nothing tracked changes. */}
              <div className="mt-7 flex flex-col items-center gap-4 md:items-start">
                <Button
                  size="lg"
                  asChild
                  className="h-13 min-w-[240px] gap-2 rounded-full px-10 text-base font-bold"
                  onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "final_cta_free_trial" }); } catch {} }}
                >
                  <Link to="/free-trial">
                    {t("hero", "startNow")}
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </Link>
                </Button>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
                  <Link
                    to="/placement-test"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-ivory/85 underline decoration-ivory/30 underline-offset-4 transition-colors hover:text-ivory hover:decoration-ivory/60"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    {isAr ? "أو حدد مستواك مجانًا" : "or take the free placement test"}
                  </Link>
                  <a
                    href={WHATSAPP_BASE}
                    onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "final_cta_homepage" }); }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-ivory/85 underline decoration-ivory/30 underline-offset-4 transition-colors hover:text-ivory hover:decoration-ivory/60"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {isAr ? "أو كلّمنا على واتساب" : "or talk to us on WhatsApp"}
                  </a>
                </div>

                <p className="text-xs text-ivory/60">
                  {isAr ? "لا بطاقة ائتمان · ٣٠ دقيقة · معلمة حقيقية · نرد خلال دقائق" : "No credit card · 30 minutes · Real teacher · We reply in minutes"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Under the ticket: the guarantee, and the community ─────── */}
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

          {/* Community proof — FOLLOWERS, not students, which is why it does not
              contradict the 200+ tile above it.

              Removed earlier on 2026-09-18 on the understanding that the real
              figure was 200, then restored the same day after checking the
              platforms: the Facebook page shows 2.4K followers and Google lists
              it at 4K+, so 2,000+ across Telegram and Facebook is conservative.
              If it is ever raised, raise it against a number someone has just
              looked at. */}
          <div className="flex items-center gap-3 rounded-2xl border-2 border-charcoal bg-ivory px-5 py-4 text-start">
            <span className="text-3xl" aria-hidden="true">🌍</span>
            <p className="text-sm font-bold leading-snug text-charcoal">
              {isAr
                ? "انضم لأكثر من ٢٠٠٠ متعلم في مجتمعنا على تيليجرام وفيسبوك"
                : "Join 2,000+ Korean learners in our Telegram & Facebook community"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

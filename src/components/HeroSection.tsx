import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Users, Star, Globe, MessageCircle, BookOpen, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
const heroPoster = "/hero-korean.jpg";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useUpcomingTrialSlots, viewerTimezone } from "@/hooks/useUpcomingTrialSlots";

/**
 * The first screen, rebuilt on the Klovers website concept board
 * (September 2026).
 *
 * What the board changes, and why each change is deliberate:
 *
 * - The hero is LIGHT. It used to be a full-bleed video wall on #1a1a1a with
 *   white and yellow text over a cinematic scrim. The board's ground is Ivory,
 *   the text is Charcoal, and the photograph sits in a card instead of behind
 *   the words. Text over moving video is also the one place on the site where
 *   contrast could not be guaranteed.
 * - The yellow is a SURFACE, never the text colour. The headline's second line
 *   used to be #ffff00 type on a dark photo; it is now charcoal type with a
 *   yellow marker stroke behind it. Both the board and the creative-direction
 *   deck state this rule.
 * - The counters are gone. The student figure used to animate from 0 to 200,
 *   which renders every intermediate value as a finished claim. The numbers
 *   below are static and say the same true things.
 *
 * Unchanged on purpose: every logLeadEvent / trackAndOpenWhatsApp call and its
 * cta_label, the /free-trial destination, the Hangul-sheet link, and the live
 * trial_slots chips (see the nextDay comment below).
 */
const HeroSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  // Trial dates come from trial_slots, not from a hardcoded array. Four such
  // arrays had accumulated across the site, none agreeing with another and
  // every one of them already in the past.
  const { slots } = useUpcomingTrialSlots();

  /**
   * The weekday of the next class, or null when there isn't one to name.
   *
   * Null covers two cases on purpose - still loading, and genuinely nothing
   * upcoming - because the honest rendering is the same for both: say
   * nothing. This used to fall back to "soon"/"قريباً", and since the slots
   * resolve a moment after first paint, "Next class: soon" above an empty pill
   * row was the first thing every visitor read, on every load.
   */
  const nextDay = useMemo(() => {
    const next = slots[0];
    if (!next) return null;
    const tz = viewerTimezone();
    return {
      en: next.startsAt.toLocaleDateString("en-US", { weekday: "long", timeZone: tz }),
      ar: next.startsAt.toLocaleDateString("ar-EG", { weekday: "long", timeZone: tz }),
    };
  }, [slots]);

  const pills = useMemo(() => {
    const tz = viewerTimezone();
    const locale = isAr ? "ar-EG" : "en-US";
    return slots.map((s) => ({
      key: `${s.date}-${s.startTime}`,
      label: `${s.startsAt.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", timeZone: tz })} · ${s.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })}`,
    }));
  }, [slots, isAr]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { type?: string; effectiveType?: string } }).connection;
    const isFast = !conn || conn.type === "wifi" || conn.effectiveType === "4g";
    if (!isFast) return;

    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      setShowVideo(true);
      video.src = "/videos/hero-korea-video-new.mp4";
      video.load();
      video.play().catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * THE TWO LARGEST NUMBERS ON THE SITE. Both were once unsupported.
   *
   * Measured on production, 2026-09-08: 102 rows in `profiles`, 76 trial
   * bookings, 25 enrolments. "500+ Students Taught" was not a rounding of
   * anything. Re's call: the 200+ figure is real, but it counts every student
   * she has taught across 13 years - not this platform. A number is only
   * honest with the sentence that scopes it, so the LABEL carries "in 13
   * years" and is part of the claim, not decoration.
   *
   * The stars belong to the GOOGLE Business Profile, which shows 5.0 from 7
   * reviews - checked signed-in as the owner. Facebook replaced star ratings
   * with Recommendations in 2018, so its "100% recommend" lives in the
   * testimonials summary instead and the two are never averaged.
   */
  const stats = [
    { icon: Users, display: "200+", label: isAr ? "طالب خلال ١٣ عاماً" : "Students in 13 years" },
    { icon: Star, display: "5.0 ★", label: isAr ? "من ٧ مراجعات جوجل" : "From 7 Google reviews" },
    { icon: Globe, display: "A1–C2", label: isAr ? "جميع المستويات" : "All levels" },
  ];

  /** The board's four promise cards, in the board's colour order. */
  const cards = [
    {
      icon: BookOpen,
      tone: "bg-mint",
      title: isAr ? "دروس مرتّبة" : "Structured lessons",
      body: isAr ? "من الهانغول إلى المحادثة" : "From Hangul to real conversations",
    },
    {
      icon: MessagesSquare,
      tone: "bg-white",
      title: isAr ? "تتدرّب مع ناس" : "Practice together",
      body: isAr ? "مجموعات صغيرة مباشرة" : "Small live groups, not recordings",
    },
    {
      icon: Globe,
      tone: "bg-peach",
      title: isAr ? "كورية حقيقية" : "Real-life Korean",
      body: isAr ? "لغة تستعملها فعلاً" : "Useful, practical, cultural",
    },
    {
      icon: Star,
      tone: "bg-mint",
      title: isAr ? "مستوى تقدر تثبته" : "A level you can prove",
      body: isAr ? "من A1 إلى C2 خطوة بخطوة" : "A1 to C2, one step at a time",
    },
  ];

  return (
    <section id="home" className="relative overflow-hidden bg-ivory pt-24 pb-14 lg:pt-28 lg:pb-20">
      {/* Soft brand washes — mint and peach, the board's supporting colours. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -start-32 h-[26rem] w-[26rem] rounded-full bg-mint/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-48 -end-28 h-80 w-80 rounded-full bg-peach/50 blur-3xl" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-10 select-none text-center font-black leading-none text-charcoal/[0.035]"
        style={{ fontSize: "clamp(140px, 24vw, 340px)", letterSpacing: "-0.02em" }}
      >
        한국어
      </span>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">

          {/* ── Left: the words ─────────────────────────────────── */}
          <div className="flex flex-col items-start gap-5 text-start">

            {/* Teacher chip — the one thing on this page no competitor has. */}
            <div className="inline-flex items-center gap-3 rounded-full border border-charcoal/10 bg-white py-1.5 ps-1.5 pe-5 shadow-sm">
              <img
                src={rehamPhoto}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="h-9 w-9 shrink-0 rounded-full object-cover object-top"
              />
              <span className="text-start leading-tight">
                <span className="block text-xs font-bold text-charcoal">
                  {isAr ? "تدرّسها ريهام الشرقاوي" : "Taught by Reham Elshrkawy"}
                </span>
                <span className="mt-0.5 block text-[11px] text-charcoal/60">
                  {isAr ? "معلمة معتمدة TOPIK · ١٣ سنة تدريس" : "TOPIK-certified · 13 years teaching"}
                </span>
              </span>
            </div>

            {/* Headline. Yellow is the marker behind line two, never the type. */}
            <h1 className="font-display font-extrabold leading-[1.08] tracking-tight text-charcoal">
              <span className="block" style={{ fontSize: "clamp(2rem, 4.6vw, 3.6rem)" }}>
                {t("hero", "title1")}
              </span>
              <span className="relative mt-1 inline-block" style={{ fontSize: "clamp(2.1rem, 5vw, 4rem)" }}>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[-0.12em] bottom-[0.06em] z-0 h-[0.36em] rounded-sm bg-klovers-yellow"
                />
                <span className="relative z-10">{t("hero", "title2")}</span>
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-charcoal/70 sm:text-lg">
              {t("hero", "subtitle")}
            </p>

            {/* One primary action. WhatsApp stays, quietly, as a text link. */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                asChild
                className="gap-2.5 rounded-full px-8 text-base font-bold shadow-[0_10px_30px_-10px_rgba(46,46,46,0.45)]"
              >
                <Link
                  to="/free-trial"
                  onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "homepage_hero_free_trial" }); } catch {} }}
                >
                  <Gift className="h-5 w-5" />
                  {t("hero", "startNow")}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <a
                href={WHATSAPP_BASE}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "homepage_hero_whatsapp" }); }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-charcoal/70 transition-colors hover:text-charcoal"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                {isAr ? "أو كلّمنا على واتساب" : "or talk to us on WhatsApp"}
              </a>
            </div>

            <p className="text-xs text-charcoal/55">
              {isAr ? "✓ بدون بطاقة بنكية · ✓ رد خلال دقائق" : "✓ No credit card · ✓ Reply in minutes"}
            </p>

            {/* Live from trial_slots, in the visitor's own timezone. */}
            {nextDay && (
              <div className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-xs font-semibold text-charcoal">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                {isAr
                  ? `الحصة التالية: ${nextDay.ar}`
                  : `Next class: ${nextDay.en}`}
              </div>
            )}

            {pills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pills.map((p) => (
                  <div
                    key={p.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs text-charcoal/70"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {p.label}
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/hangul-starter"
              className="inline-flex items-center gap-2 text-xs text-charcoal/60 underline decoration-charcoal/25 underline-offset-4 transition-colors hover:text-charcoal hover:decoration-charcoal/50"
              onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "hero_hangul_sheet" }); } catch {} }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {isAr ? "احصل على ورقة هانغول المجانية ←" : "Free Hangul starter sheet →"}
            </Link>
          </div>

          {/* ── Right: the picture, in a card ───────────────────────── */}
          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2.5rem] bg-mint/45 blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-white bg-white p-2 shadow-[0_28px_70px_-28px_rgba(46,46,46,0.45)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-charcoal/5">
                <img
                  src={heroPoster}
                  alt={isAr ? "طالبة تدرس الكورية أونلاين" : "A student learning Korean online"}
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${videoReady ? "opacity-0" : "opacity-100"}`}
                />
                {showVideo && (
                  <video
                    ref={videoRef}
                    poster={heroPoster}
                    preload="none"
                    loop
                    muted
                    playsInline
                    aria-hidden="true"
                    onCanPlay={() => setVideoReady(true)}
                    className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </div>
            </div>

            {/* Handwritten accent — the board's Caveat note. */}
            <div className="absolute -bottom-4 -start-3 -rotate-6 rounded-2xl bg-klovers-yellow px-5 py-2 shadow-lg">
              <span className="font-script text-2xl font-bold text-charcoal">
                {isAr ? "نبدأ من الصفر" : "Start from zero"}
              </span>
            </div>
          </div>
        </div>

        {/* ── The board's four promise cards ─────────────────────────── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {cards.map(({ icon: Icon, tone, title, body }) => (
            <div
              key={title}
              className={`rounded-2xl border border-charcoal/10 p-5 ${tone} shadow-[0_10px_30px_-24px_rgba(46,46,46,0.6)]`}
            >
              <Icon className="mb-3 h-6 w-6 text-charcoal" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-charcoal">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{body}</p>
            </div>
          ))}
        </div>

        {/* ── Proof strip — static, no counters ─────────────────────── */}
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white px-4 py-5 sm:px-8">
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ icon: Icon, display, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-1.5">
                  <Icon className="hidden h-4 w-4 text-charcoal/40 sm:block" aria-hidden="true" />
                  <span className="font-display text-2xl font-extrabold text-charcoal sm:text-3xl">{display}</span>
                </div>
                <span className="text-xs font-medium text-charcoal/60 sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { useRef, useEffect, useState, useMemo, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Users, Star, Globe, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
const heroPoster = "/hero-korean.jpg";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useUpcomingTrialSlots, viewerTimezone } from "@/hooks/useUpcomingTrialSlots";

const useCountUp = (target: number, duration = 1800) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced motion gets the answer, not the animation.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setCount(Math.round(t * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
};

const HeroSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  // Trial dates come from trial_slots, not from a hardcoded array. Four such
  // arrays had accumulated across the site, none agreeing with another and
  // every one of them already in the past - which is why this hero has been
  // showing "Next class: soon" above an empty row of pills.
  const { slots } = useUpcomingTrialSlots();

  /**
   * The weekday of the next class, or null when there isn't one to name.
   *
   * Null covers two cases on purpose - still loading, and genuinely nothing
   * upcoming - because the honest rendering is the same for both: say
   * nothing. This used to fall back to "soon"/"قريباً", and since the slots
   * resolve a moment after first paint, "Next class: soon - spots filling
   * fast" above an empty pill row was the first thing every visitor read, on
   * every load. The vaguest sentence in the hero was also the most reliably
   * seen one.
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

  /**
   * THE TWO LARGEST NUMBERS ON THE SITE. Both were unsupported.
   *
   * Measured on production, 2026-09-08: 102 rows in `profiles`, 76 trial
   * bookings, 25 enrolments. "500+ Students Taught" was not a rounding of
   * anything.
   *
   * Re's call: the 200+ figure is real, but it counts every student she has
   * taught across 13 years - not this platform. A number is only honest with
   * the sentence that scopes it, so the LABEL carries "in 13 years" and is
   * part of the claim, not decoration. Do not shorten it back to "Students
   * Taught" without changing the number too.
   *
   * 2026-09-18: the rating no longer counts up. A count-up renders every
   * intermediate value as a finished claim, and "0.6 ★" is a worse sentence
   * than any marketing copy this block was written to remove. Student count
   * still animates - "17+ students" on the way to 200 is wrong for a moment
   * too, but it is a quantity, and a quantity ticking upward reads as a
   * counter. A star rating does not.
   *
   * 2026-09-18, same day, second pass: the rating tile said "4.9 / From 16
   * reviews". Both halves were wrong. 16 was the Facebook count on 8 Sep and
   * is 20 today; and 4.9 was never Facebook's number, because Facebook
   * replaced star ratings with Recommendations in 2018 and shows "100%
   * recommend" instead. The stars belong to the GOOGLE Business Profile,
   * which shows 5.0 from 7 reviews - checked signed-in as the owner. So this
   * tile now names Google, and Facebook's metric sits in the testimonials
   * summary, in the section that links to that page. Neither number is
   * averaged against the other: a percentage and a five-point scale do not
   * combine.
   */
  const { count: studentCount, ref: studentRef } = useCountUp(200);

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

  const stats: { icon: typeof Users; ref?: Ref<HTMLSpanElement>; display: string; label: string }[] = [
    // The label is part of the claim here, not a caption under it.
    // "200+ / Students in 13 years" is true; "200+ / Students Taught"
    // beside a platform with 102 accounts is not.
    { icon: Users, ref: studentRef, display: `${studentCount.toLocaleString('en-US')}+`, label: isAr ? "طالب خلال ١٣ عاماً" : "Students in 13 years" },
    // The source is in the label on purpose. An unattributed "4.9" is a
    // slogan; "5.0 / From 7 Google reviews" is a sentence someone can go and
    // check, and it goes stale visibly rather than silently.
    { icon: Star, display: "5.0 ★", label: isAr ? "من ٧ مراجعات جوجل" : "From 7 Google reviews" },
    // "6 Months to Conversational" was a timeline claim with no
    // data behind it, the same pattern as the "500+" figures this
    // hero was already rewritten to move away from (see the block
    // comment above studentCount). A1–C2 is the one thing here
    // that's just true - it's the actual level range taught, same
    // claim already used on AboutPage.tsx and PlacementTestPage.tsx.
    { icon: Globe, display: "A1–C2", label: isAr ? "جميع المستويات" : "All Levels" },
  ];

  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex flex-col items-center justify-center pt-16 overflow-hidden"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      {/* ── Background layer ──────────────────────────── */}
      <img
        src={heroPoster}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 animate-ken-burns brightness-110 saturate-[1.15] ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
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
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Cinematic gradient — just enough for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/55" />
      {/* Bottom scrim for stats readability */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Primary colour glow behind headline */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(60 100% 50% / 0.18) 0%, transparent 70%)" }}
      />

      {/* ── Decorative large Korean text (backdrop) ─────────────────── */}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: "clamp(180px, 30vw, 420px)",
          fontWeight: 900,
          color: "rgba(255, 255, 0, 0.035)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        한국어
      </span>

      {/* ── Hero text content — truly centered ──────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 text-center pb-36">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 sm:gap-8">

          {/* Teacher chip — the first thing on the page, and the one thing on it
              no competitor has.

              It replaces a split pill that read "🇰🇷 KLOVERS / Enrolling Now".
              The left half repeated the logo 40px above it in the header; the
              right half repeated the next-class chip directly below, which
              says the same thing with a date attached. "Enrolling Now" also
              rendered unconditionally - including when trial_slots has nothing
              upcoming, which is precisely when it is untrue. It is not
              reinstated anywhere: the next-class chip carries that signal, and
              only when there is a real class to name.

              The photo is the same asset MeetTeacher.tsx already renders lower
              down, so this adds no new file - only a 36px avatar, lazily
              fetched so it stays out of the LCP path. alt="" is deliberate:
              her name sits immediately beside it as text, so a screen reader
              announcing the image too would just repeat it. */}
          <div className="inline-flex items-center gap-3 bg-black/45 border border-white/20 backdrop-blur-md rounded-full py-1.5 ps-1.5 pe-5 shadow-xl">
            <img
              src={rehamPhoto}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              decoding="async"
              className="h-9 w-9 rounded-full object-cover object-top shrink-0 ring-1 ring-white/30"
            />
            <span className="text-start leading-tight">
              <span className="block text-white text-xs font-bold">
                {isAr ? "تدرّسها ريهام الشرقاوي" : "Taught by Reham Elshrkawy"}
              </span>
              <span className="block text-white/65 text-[11px] mt-0.5">
                {isAr ? "معلمة معتمدة TOPIK · ١٣ سنة تدريس" : "TOPIK-certified · 13 years teaching"}
              </span>
            </span>
          </div>

          {/* Next-class urgency chip — the one pulsing signal in the hero.
              Rendered only when there is a real next class to name; see the
              nextDay comment above for why there is no "soon" fallback. */}
          {nextDay && (
            <div className="inline-flex items-center gap-2 bg-black/40 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-white/90">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              {isAr
                ? `الحصة التالية: ${nextDay.ar} — سجّل دلوقتي`
                : `Next class: ${nextDay.en} — spots filling fast`}
            </div>
          )}

          {/* Main headline */}
          <h1
            className="font-black text-white leading-[1.05] tracking-tighter w-full"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)" }}
          >
            <span className="block" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)" }}>
              {t("hero", "title1")}
            </span>
            <span
              className="block mt-1"
              style={{
                fontSize: "clamp(2.4rem, 6.8vw, 5.5rem)",
                color: "#ffff00",
                textShadow: "0 0 80px rgba(255, 255, 0, 0.4), 0 4px 24px rgba(0,0,0,0.7)"
              }}
            >
              {t("hero", "title2")}
            </span>
          </h1>

          {/* Subtitle — fixed 2026-09-18: used to read "Join 500+ K-drama fans",
              the same inflated figure the honest stats strip below was
              rewritten to move away from. Lives in src/i18n/translations.ts
              (`hero.subtitle`, both `en` and `ar`). */}
          <p
            className="text-base sm:text-xl md:text-2xl text-white/85 max-w-xl mx-auto leading-relaxed text-pretty"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}
          >
            {t("hero", "subtitle")}
          </p>

          {/* CTA Buttons — 2 max to eliminate choice paralysis */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm sm:max-w-none mx-auto">
            <Button
              size="lg"
              asChild
              className="gap-2.5 text-base font-bold px-10 shadow-2xl"
              style={{ boxShadow: "0 0 36px hsl(60 100% 50% / 0.3), 0 8px 24px rgba(0,0,0,0.4)" }}
            >
              <Link
                to="/free-trial"
                onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "homepage_hero_free_trial" }); } catch {} }}
              >
                <Gift className="h-5 w-5" />
                {t("hero", "startNow")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant="outline"
              // Secondary by design: the free-trial button above is the one
              // primary action. This used to be solid WhatsApp-green at the
              // same size and weight, which visually out-competed the button
              // meant to be primary — a border reads as "also available,"
              // a solid fill reads as "do this."
              className="gap-2.5 text-base font-semibold px-8 bg-transparent hover:bg-white/10 text-white border-2 border-white/40 hover:border-white/60"
            >
              <a
                href={WHATSAPP_BASE}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "homepage_hero_whatsapp" }); }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                {isAr ? "واتساب" : "WhatsApp Us"}
              </a>
            </Button>
          </div>

          {/* Micro trust line — "TOPIK-certified teacher" was dropped 2026-09-18
              when the teacher chip above took over that claim, with her face
              and name attached to it. Saying it twice in one screen made it
              read as a slogan rather than a fact. */}
          <p className="text-white/60 text-xs" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            {isAr ? "✓ بدون بطاقة بنكية · ✓ رد خلال دقائق" : "✓ No credit card · ✓ Reply in minutes"}
          </p>

          {/* Upcoming class sessions — live from trial_slots, shown in the
              visitor's own timezone. Renders nothing while loading or when
              there is genuinely no upcoming slot, which is honest either way. */}
          <div className="flex flex-wrap gap-2 justify-center">
            {pills.map((p) => (
              <div key={p.key} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {p.label}
              </div>
            ))}
          </div>

          {/* Hangul sheet — reciprocity trigger */}
          <Link
            to="/hangul-starter"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
            onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "hero_hangul_sheet" }); } catch {} }}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {isAr ? "احصل على ورقة هانغول المجانية ←" : "Free Hangul starter sheet →"}
          </Link>

        </div>
      </div>

      {/* ── Stats strip — absolutely pinned to bottom ──────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 sm:pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/25 to-transparent mb-6" />
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {stats.map(({ icon: Icon, ref: itemRef, display, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center group">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary hidden sm:block" />
                  <span
                    ref={itemRef}
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-white"
                    style={{ textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}
                  >
                    {display}
                  </span>
                </div>
                <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Users, Star, MessageCircle, BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
const heroPoster = "/hero-korean.jpg";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useUpcomingTrialSlots, viewerTimezone } from "@/hooks/useUpcomingTrialSlots";

/**
 * The first screen: the full-bleed cover Re picked, fused with the concept
 * board's card row.
 *
 * Two halves, deliberately:
 *
 * 1. THE COVER. Photo/video wall, giant centred headline, proof strip under
 *    the actions. Charcoal #2E2E2E ground and scrims instead of pure black,
 *    Ivory #FFF9EC text instead of pure white. The next-class chip and the
 *    slot pills carry live-bright, the "happening now" status colour for dark
 *    grounds. The headline's second line stays Klovers Yellow: yellow as TYPE
 *    is endorsed on a dark ground and ruled out only on a light one.
 *
 *    NOTE this section is dark in BOTH themes - it is a photo under a charcoal
 *    scrim, not a themed surface. That is why it uses live-bright and the
 *    ivory/charcoal literals rather than the theme's foreground tokens.
 *
 * 2. THE CARD ROW. On the board these sit at the foot of the hero, half on
 *    the image. They lift 48px on phones and 80px from sm up to do the same
 *    here. The content column's bottom padding (pb-24 / sm:pb-32) is the room
 *    they take out of the photo; change one, change the other.
 *
 * THE PROOF STRIP IS IN NORMAL FLOW (23 Sep 2026). It used to be
 * `absolute bottom-0` of the section while the text column grew above it -
 * two layers with no knowledge of each other. Every extra line (a date chip,
 * the Hangul link, a translation that wrapped) pushed the column into the
 * strip, and three rounds of padding tweaks (pb-44, a max-height query, an
 * overlay-aware pb-40) each fixed one viewport and missed the next. In flow,
 * the strip simply comes after the content, so nothing can land on it.
 *
 * Numbers are static. A count-up renders every intermediate value as a
 * finished claim - "17+ students" is wrong for a moment too.
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
   * Null covers two cases on purpose — still loading, and genuinely nothing
   * upcoming — because the honest rendering is the same for both: say nothing.
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

  // Capped to 3: with a busy schedule this list can grow past what a single
  // row can hold on narrow screens, wrapping unpredictably. Three keeps it a
  // single tidy row on every breakpoint we support; there is no next/more
  // affordance because the full list is one click away on /free-trial.
  //
  // The time carries the viewer's own zone name (timeZoneName: "short" -
  // "EDT", "GMT+3", ...). A bare "7:00 PM" read as Cairo time to some
  // visitors and as their own to others; the 23 Sep review flagged it.
  const pills = useMemo(() => {
    const tz = viewerTimezone();
    const locale = isAr ? "ar-EG" : "en-US";
    return slots.slice(0, 3).map((s) => ({
      key: `${s.date}-${s.startTime}`,
      label: `${s.startsAt.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", timeZone: tz })} · ${s.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz, timeZoneName: "short" })}`,
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
   * THE THREE NUMBERS, AND WHAT EACH ONE COUNTS (Re, 23 Sep 2026).
   *
   * - 200+ is the students Reham has taught herself, across 13 years - not
   *   accounts on this platform.
   * - 2,000+ is the Klovers community on social media (Facebook, Telegram and
   *   the rest) - followers, not students. The review read the two as
   *   contradicting each other because one said "students" and the other
   *   "community" in different places; side by side, each with its own label,
   *   they don't.
   * - The stars belong to the GOOGLE Business Profile: 5.0 from 7 reviews.
   *   Facebook's "100% recommend" lives in the testimonials summary, labelled
   *   as Facebook, and the two are never averaged.
   *
   * FinalCTA.tsx shows the same three; if one changes, change both.
   */
  const stats = [
    { icon: Users, display: "200+", label: isAr ? "طالب درّستهم ريهام" : "Students taught by Reham" },
    { icon: Heart, display: "2,000+", label: isAr ? "متابع في مجتمعنا على السوشيال" : "In our social media community" },
    { icon: Star, display: "5.0 ★", label: isAr ? "من ٧ مراجعات جوجل" : "From 7 Google reviews" },
  ];

  /**
   * The board's four promise cards.
   *
   * The board alternated Mint / white / Peach / Mint. The brand is three
   * colours now — Yellow, Charcoal, Ivory — so the row alternates Yellow and
   * white. The rhythm is what the board was after; the extra colours were not
   * carrying meaning.
   *
   * h3, not h2: these are four short promises inside the hero, not four
   * sections of the page. As h2s they made the outline read like sixteen
   * sections.
   */
  const cards = [
    {
      icon: "klobi-reading" as KloverIconName,
      tone: "bg-klovers-yellow",
      title: isAr ? "دروس مرتّبة" : "Structured lessons",
      body: isAr ? "من الهانغول إلى المحادثة" : "From basics to real conversations",
    },
    {
      icon: "chat-annyeong" as KloverIconName,
      tone: "bg-white",
      title: isAr ? "تتدرّب مع ناس" : "Practice together",
      body: isAr ? "مجموعات صغيرة مباشرة" : "Learn with a supportive community",
    },
    {
      icon: "globe-plane" as KloverIconName,
      tone: "bg-klovers-yellow",
      title: isAr ? "كورية حقيقية" : "Real-life Korean",
      body: isAr ? "لغة تستعملها فعلاً" : "Useful, practical, cultural",
    },
    {
      icon: "namsan-tower" as KloverIconName,
      tone: "bg-white",
      title: isAr ? "نسخة أفضل منك" : "A brighter you",
      body: isAr ? "ثقة أكبر، وعالم أوسع" : "More confidence. A bigger world.",
    },
  ];

  return (
    <>
      <section
        id="home"
        className="relative min-h-[94svh] flex flex-col items-center justify-center pt-16 overflow-hidden bg-charcoal"
      >
        {/* ── Background layer ─────────────────────────── */}
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

        {/* Cinematic scrim — Charcoal rather than pure black, so the photo keeps
            its warmth and the section belongs to the same palette as the rest
            of the page. Enough density for text contrast, no more. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(46,46,46,0.55) 0%, rgba(46,46,46,0.15) 45%, rgba(46,46,46,0.62) 100%)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: "linear-gradient(to top, rgba(46,46,46,0.6), transparent)" }}
        />

        {/* Brand-yellow glow behind the headline */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(60 100% 50% / 0.18) 0%, transparent 70%)" }}
        />

        {/* ── Decorative large Korean text (backdrop) ───────────── */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-ko-hand"
          style={{
            fontSize: "clamp(180px, 30vw, 420px)",
            fontWeight: 400,
            color: "rgba(255, 255, 0, 0.035)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          한국어
        </span>

        {/* ── Hero text content ─────────────────────────────
            pt-8 gives the teacher chip air under the header; pb-24/sm:pb-32 is
            the room the promise cards take when they lift onto the photo. */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 text-center pt-8 pb-24 sm:pb-32">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-5 sm:gap-7">

            {/* Teacher chip — the one thing on this page no competitor has. */}
            <div className="inline-flex items-center gap-3 bg-charcoal/55 border border-ivory/20 backdrop-blur-md rounded-full py-1.5 ps-1.5 pe-5 shadow-xl">
              <img
                src={rehamPhoto}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="h-9 w-9 rounded-full object-cover object-top shrink-0 ring-1 ring-ivory/30"
              />
              <span className="text-start leading-tight">
                <span className="block text-ivory text-xs font-bold">
                  {isAr ? "تدرّسها ريهام الشرقاوي" : "Taught by Reham Elshrkawy"}
                </span>
                <span className="block text-ivory/65 text-[11px] mt-0.5">
                  {isAr ? "١٣ سنة في تدريس الكورية" : "13 years teaching Korean"}
                </span>
              </span>
            </div>

            {/* Next-class chip — rendered only when there is a real class to
                name. live-bright is the "happening now" status colour for dark
                grounds; the light-theme --live would vanish against this scrim. */}
            {nextDay && (
              <div className="inline-flex items-center gap-2 bg-live-bright/15 border border-live-bright/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-live-bright">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live-bright opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live-bright" />
                </span>
                {isAr
                  ? `الحصة التالية: ${nextDay.ar} — سجّل دلوقتي`
                  : `Next class: ${nextDay.en} — spots filling fast`}
              </div>
            )}

            {/* Main headline. Yellow as TYPE is correct here and only here:
                this is a dark photo under a scrim, not a light ground. */}
            <h1
              className="font-display font-extrabold text-ivory leading-[1.05] tracking-tighter w-full"
              style={{ textShadow: "0 4px 40px rgba(20,20,18,0.9), 0 2px 8px rgba(20,20,18,0.8)" }}
            >
              <span className="block" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)" }}>
                {t("hero", "title1")}
              </span>
              <span
                className="block mt-1"
                style={{
                  fontSize: "clamp(2.4rem, 6.8vw, 5.5rem)",
                  color: "#FFFF00",
                  textShadow: "0 0 80px rgba(255, 255, 0, 0.4), 0 4px 24px rgba(20,20,18,0.7)"
                }}
              >
                {t("hero", "title2")}
              </span>
            </h1>

            <p className="text-ivory/85 text-sm sm:text-base font-medium max-w-xl" style={{ textShadow: "0 1px 8px rgba(20,20,18,0.8)" }}>
              {isAr
                ? "حصص أونلاين مباشرة بالعربي أو الإنجليزي، بحد أقصى 8 طلاب في المجموعة"
                : "Live online classes in English or Arabic, max 8 students per group"}
            </p>

            {/* CTA Buttons — 2 max to eliminate choice paralysis */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm sm:max-w-none mx-auto">
              <Button
                size="lg"
                asChild
                className="gap-2.5 text-base font-bold px-10 rounded-full shadow-2xl"
                style={{ boxShadow: "0 0 36px hsl(60 100% 50% / 0.3), 0 8px 24px rgba(20,20,18,0.4)" }}
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
              <Button
                size="lg"
                asChild
                variant="outline"
                // Secondary by design: the free-trial button above is the one
                // primary action. A border reads as "also available," a solid
                // fill reads as "do this."
                className="gap-2.5 text-base font-semibold px-8 rounded-full bg-transparent hover:bg-ivory/10 text-ivory border-2 border-ivory/40 hover:border-ivory/60"
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

            <p className="text-ivory/60 text-xs" style={{ textShadow: "0 1px 8px rgba(20,20,18,0.8)" }}>
              {isAr ? "✓ بدون بطاقة بنكية · ✓ رد خلال دقائق" : "✓ No credit card · ✓ Reply in minutes"}
            </p>

            {/* Upcoming class sessions — live from trial_slots, in the visitor's
                own timezone, with the zone named. Capped to 3 (see `pills`).
                Renders nothing while loading or when there is genuinely no
                upcoming slot, which is honest either way. */}
            {pills.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {pills.map((p) => (
                  <div key={p.key} className="inline-flex items-center gap-1.5 bg-ivory/10 border border-ivory/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-ivory/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-live-bright shrink-0" />
                    {p.label}
                  </div>
                ))}
              </div>
            )}

            {/* Hangul sheet — reciprocity trigger */}
            <Link
              to="/hangul-starter"
              className="inline-flex min-h-11 items-center gap-2 text-ivory/70 hover:text-ivory transition-colors text-xs underline underline-offset-4 decoration-ivory/30 hover:decoration-ivory/60"
              onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "hero_hangul_sheet" }); } catch {} }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {isAr ? "احصل على ورقة هانغول المجانية ←" : "Free Hangul starter sheet →"}
            </Link>

            {/* ── Proof strip — in flow, after everything above it ───────── */}
            <div className="w-full max-w-3xl mx-auto pt-2">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-ivory/25 to-transparent mb-5" />
              <div className="grid grid-cols-3 gap-3 md:gap-8">
                {stats.map(({ icon: Icon, display, label }) => (
                  <div key={display} className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-klovers-yellow hidden sm:block" aria-hidden="true" />
                      <span
                        className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-ivory"
                        style={{ textShadow: "0 2px 16px rgba(20,20,18,0.8)" }}
                      >
                        {display}
                      </span>
                    </div>
                    <span className="text-ivory/90 text-xs sm:text-sm font-medium tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── The board's four promise cards, lifted onto the cover ──────────
          No background of its own: the cards overlap the photo and the page's
          Ivory carries the rest, so there is no band and no seam. */}
      <div className="relative z-20 mx-auto max-w-6xl px-4 -mt-12 pb-12 sm:-mt-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon, tone, title, body }) => (
            <div
              key={title}
              className={`rounded-2xl border border-charcoal/10 p-5 ${tone} shadow-[0_18px_40px_-24px_rgba(46,46,46,0.75)]`}
            >
              <KloverIcon name={icon} className="mb-3 h-14 w-14" />
              <h3 className="font-display text-base font-bold text-charcoal">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;

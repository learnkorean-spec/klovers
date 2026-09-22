import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Users, Star, Globe, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
const heroPoster = "/hero-korean.jpg";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useUpcomingTrialSlots, viewerTimezone } from "@/hooks/useUpcomingTrialSlots";
import { useAnyBottomSlotActive } from "@/lib/bottomLayer";
import { useAnyBottomSlotActive } from "@/lib/bottomLayer";

/**
 * The first screen: the full-bleed cover Re picked, fused with the concept
 * board's card row.
 *
 * Two halves, deliberately:
 *
 * 1. THE COVER. Photo/video wall, giant centred headline, proof strip pinned
<<<<<<< HEAD
 * to the bottom. Repainted on the board - Charcoal #2E2E2E ground and
 * scrims instead of pure black, Ivory #FFF9EC text instead of pure white.
 * The next-class chip and the slot pills carry live-bright, the "happening
 * now" status colour for dark grounds. The headline's second line stays
 * Klovers Yellow: yellow as TYPE is endorsed on a dark ground and ruled out
 * only on a light one.
 *
 * NOTE this section is dark in BOTH themes - it is a photo under a charcoal
 * scrim, not a themed surface. That is why it uses live-bright and the
 * ivory/charcoal literals rather than the theme's foreground tokens.
=======
 *    to the bottom. Repainted on the board - Charcoal #2E2E2E ground and
 *    scrims instead of pure black, Ivory #FFF9EC text instead of pure white.
 *    The next-class chip and the slot pills carry live-bright, the "happening
 *    now" status colour for dark grounds. The headline's second line stays
 *    Klovers Yellow: yellow as TYPE is endorsed on a dark ground and ruled out
 *    only on a light one.
 *
 *    NOTE this section is dark in BOTH themes - it is a photo under a charcoal
 *    scrim, not a themed surface. That is why it uses live-bright and the
 *    ivory/charcoal literals rather than the theme's foreground tokens.
>>>>>>> 56d741e59b388f6f6833c9b71a985804ec59cb60
 *
 * 2. THE CARD ROW. On the board these sit at the foot of the hero, half on
 * the image. They lift 48px on phones and 80px from sm up to do the same
 * here, and the row carries no background of its own - what shows under
 * them is the page's own Ivory, so there is no band and no seam. The proof
 * strip clears that overlap by the same amount; if you change one, change
 * the other, or the cards cover the numbers.
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

  // HomeExitNudge / StickyEnrollBar / etc. are fixed to the VIEWPORT
  // (src/lib/bottomLayer.ts); the proof strip below is pinned to this
  // SECTION's own bottom. On a short viewport where the hero still fills
  // the screen, an active overlay was painting straight over the stats.
  const bottomOverlayActive = useAnyBottomSlotActive();

  // Whether HomeExitNudge / StickyEnrollBar / InstallPrompt / InterviewChip
  // currently hold the bottom of the viewport (src/lib/bottomLayer.ts). That
  // layer is fixed to the VIEWPORT, while the proof strip below is pinned to
  // the bottom of this SECTION â€” on a short viewport where the hero still
  // fills the screen, the overlay was painting straight over the stats.
  const bottomOverlayActive = useAnyBottomSlotActive();

  /**
   * The weekday of the next class, or null when there isn't one to name.
   *
   * Null covers two cases on purpose â€” still loading, and genuinely nothing
   * upcoming â€” because the honest rendering is the same for both: say nothing.
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
  const pills = useMemo(() => {
    const tz = viewerTimezone();
    const locale = isAr ? "ar-EG" : "en-US";
    return slots.slice(0, 3).map((s) => ({
      key: `${s.date}-${s.startTime}`,
      label: `${s.startsAt.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", timeZone: tz })} Â· ${s.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })}`,
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
   * she has taught across 13 years â€” not this platform. A number is only
   * honest with the sentence that scopes it, so the LABEL carries "in 13
   * years" and is part of the claim, not decoration.
   *
   * The stars belong to the GOOGLE Business Profile, which shows 5.0 from 7
   * reviews â€” checked signed-in as the owner. Facebook replaced star ratings
   * with Recommendations in 2018, so its "100% recommend" lives in the
   * testimonials summary instead and the two are never averaged.
   */
  const stats = [
    { icon: Users, display: "200+", label: isAr ? "Ø·Ø§Ù„Ø¨ Ø®Ù„Ø§Ù„ Ù¡Ù£ Ø¹Ø§Ù…Ø§Ù‹" : "Students in 13 years" },
    { icon: Star, display: "5.0 â˜…", label: isAr ? "Ù…Ù† Ù§ Ù…Ø±Ø§Ø¬Ø¹Ø§Øª Ø¬ÙˆØ¬Ù„" : "From 7 Google reviews" },
    { icon: Globe, display: "A1â€“C2", label: isAr ? "Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø³ØªÙˆÙŠØ§Øª" : "All Levels" },
  ];

  /**
   * The board's four promise cards.
   *
   * The board alternated Mint / white / Peach / Mint. The brand is three
<<<<<<< HEAD
   * colours now â€” Yellow, Charcoal, Ivory â€” so the row alternates Yellow and
=======
   * colours now — Yellow, Charcoal, Ivory — so the row alternates Yellow and
>>>>>>> 56d741e59b388f6f6833c9b71a985804ec59cb60
   * white. The rhythm is what the board was after; the extra colours were not
   * carrying meaning.
   */
  const cards = [
    {
      icon: "klobi-reading" as KloverIconName,
      tone: "bg-klovers-yellow",
      title: isAr ? "Ø¯Ø±ÙˆØ³ Ù…Ø±ØªÙ‘Ø¨Ø©" : "Structured lessons",
      body: isAr ? "Ù…Ù† Ø§Ù„Ù‡Ø§Ù†ØºÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©" : "From basics to real conversations",
    },
    {
      icon: "chat-annyeong" as KloverIconName,
      tone: "bg-white",
      title: isAr ? "ØªØªØ¯Ø±Ù‘Ø¨ Ù…Ø¹ Ù†Ø§Ø³" : "Practice together",
      body: isAr ? "Ù…Ø¬Ù…ÙˆØ¹Ø§Øª ØµØºÙŠØ±Ø© Ù…Ø¨Ø§Ø´Ø±Ø©" : "Learn with a supportive community",
    },
    {
      icon: "globe-plane" as KloverIconName,
      tone: "bg-klovers-yellow",
      title: isAr ? "ÙƒÙˆØ±ÙŠØ© Ø­Ù‚ÙŠÙ‚ÙŠØ©" : "Real-life Korean",
      body: isAr ? "Ù„ØºØ© ØªØ³ØªØ¹Ù…Ù„Ù‡Ø§ ÙØ¹Ù„Ø§Ù‹" : "Useful, practical, cultural",
    },
    {
      icon: "namsan-tower" as KloverIconName,
      tone: "bg-white",
      title: isAr ? "Ù†Ø³Ø®Ø© Ø£ÙØ¶Ù„ Ù…Ù†Ùƒ" : "A brighter you",
      body: isAr ? "Ø«Ù‚Ø© Ø£ÙƒØ¨Ø±ØŒ ÙˆØ¹Ø§Ù„Ù… Ø£ÙˆØ³Ø¹" : "More confidence. A bigger world.",
    },
  ];

  return (
    <>
      <section
        id="home"
        className="relative min-h-[94svh] flex flex-col items-center justify-center pt-16 overflow-hidden bg-charcoal"
      >
        {/* â”€â”€ Background layer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* Cinematic scrim â€” Charcoal rather than pure black, so the photo keeps
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

        {/* â”€â”€ Decorative large Korean text (backdrop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
          í•œêµ­ì–´
        </span>

<<<<<<< HEAD
        {/* â”€â”€ Hero text content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
=======
        {/* ── Hero text content ───────────────────────────── */}
>>>>>>> 56d741e59b388f6f6833c9b71a985804ec59cb60
        {/* pb-44 is tuned for typical phone/desktop heights. On short
            viewports (iPad landscape, most laptops with a shallow browser
            window) the section's min-height doesn't leave enough room below
            this block for the proof strip's pinned-to-bottom stats â€” the
            "Free Hangul starter sheet" link was overlapping the "5.0 â˜…"
            stat. The max-height query adds extra clearance only when the
            viewport is short enough for that to matter; normal-height
            phones/desktops are untouched. See the "Proof strip" comment
            below for why the strip is pinned to the section's bottom at all. */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 text-center pb-44 [@media(max-height:900px)]:pb-64">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 sm:gap-8">

            {/* Teacher chip â€” the one thing on this page no competitor has. */}
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
                  {isAr ? "ØªØ¯Ø±Ù‘Ø³Ù‡Ø§ Ø±ÙŠÙ‡Ø§Ù… Ø§Ù„Ø´Ø±Ù‚Ø§ÙˆÙŠ" : "Taught by Reham Elshrkawy"}
                </span>
                <span className="block text-ivory/65 text-[11px] mt-0.5">
                  {isAr ? "Ù…Ø¹Ù„Ù…Ø© Ù…Ø¹ØªÙ…Ø¯Ø© TOPIK Â· Ù¡Ù£ Ø³Ù†Ø© ØªØ¯Ø±ÙŠØ³" : "TOPIK-certified Â· 13 years teaching"}
                </span>
              </span>
            </div>

<<<<<<< HEAD
            {/* Next-class chip â€” rendered only when there is a real class to
=======
            {/* Next-class chip — rendered only when there is a real class to
>>>>>>> 56d741e59b388f6f6833c9b71a985804ec59cb60
                name. live-bright is the "happening now" status colour for dark
                grounds; the light-theme --live would vanish against this scrim. */}
            {nextDay && (
              <div className="inline-flex items-center gap-2 bg-live-bright/15 border border-live-bright/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-live-bright">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live-bright opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live-bright" />
                </span>
                {isAr
                  ? `Ø§Ù„Ø­ØµØ© Ø§Ù„ØªØ§Ù„ÙŠØ©: ${nextDay.ar} â€” Ø³Ø¬Ù‘Ù„ Ø¯Ù„ÙˆÙ‚ØªÙŠ`
                  : `Next class: ${nextDay.en} â€” spots filling fast`}
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

            {/* CTA Buttons â€” 2 max to eliminate choice paralysis */}
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
                  {isAr ? "ÙˆØ§ØªØ³Ø§Ø¨" : "WhatsApp Us"}
                </a>
              </Button>
            </div>

            <p className="text-ivory/60 text-xs" style={{ textShadow: "0 1px 8px rgba(20,20,18,0.8)" }}>
              {isAr ? "âœ“ Ø¨Ø¯ÙˆÙ† Ø¨Ø·Ø§Ù‚Ø© Ø¨Ù†ÙƒÙŠØ© Â· âœ“ Ø±Ø¯ Ø®Ù„Ø§Ù„ Ø¯Ù‚Ø§Ø¦Ù‚" : "âœ“ No credit card Â· âœ“ Reply in minutes"}
            </p>

            {/* Upcoming class sessions â€” live from trial_slots, in the visitor's
                own timezone. Capped to 3 (see `pills` above) so a busy schedule
                can't wrap unpredictably. Renders nothing while loading or when
                there is genuinely no upcoming slot, which is honest either way. */}
            <div className="flex flex-wrap gap-2 justify-center">
              {pills.map((p) => (
                <div key={p.key} className="inline-flex items-center gap-1.5 bg-ivory/10 border border-ivory/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-ivory/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-live-bright shrink-0" />
                  {p.label}
                </div>
              ))}
            </div>

            {/* Hangul sheet â€” reciprocity trigger */}
            <Link
              to="/hangul-starter"
              className="inline-flex min-h-11 items-center gap-2 text-ivory/70 hover:text-ivory transition-colors text-xs underline underline-offset-4 decoration-ivory/30 hover:decoration-ivory/60"
              onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "hero_hangul_sheet" }); } catch {} }}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {isAr ? "Ø§Ø­ØµÙ„ Ø¹Ù„Ù‰ ÙˆØ±Ù‚Ø© Ù‡Ø§Ù†ØºÙˆÙ„ Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠØ© â†" : "Free Hangul starter sheet â†’"}
            </Link>

          </div>
        </div>

        {/* â”€â”€ Proof strip â€” pinned above the card overlap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            pb-24/pb-32 is not spacing taste: it is exactly the room the cards
            below take out of this section when they lift onto the photo.

            22 Sep 2026: this strip is `absolute bottom-0` of the SECTION,
            while HomeExitNudge / StickyEnrollBar / etc. are `fixed bottom-0`
            of the VIEWPORT (src/lib/bottomLayer.ts) â€” two layers with no
            knowledge of each other. On a short viewport where the hero still
            fills the screen, the overlay painted straight over these numbers.
            bottomOverlayActive adds enough extra clearance to lift the strip
            above whichever one is currently up; it reverts the moment that
            overlay is dismissed. */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 px-4 transition-[padding] duration-300 ${
            bottomOverlayActive ? "pb-40 sm:pb-48" : "pb-24 sm:pb-32"
          }`}
        >
          <div className="max-w-3xl mx-auto">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-ivory/25 to-transparent mb-6" />
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              {stats.map(({ icon: Icon, display, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-klovers-yellow hidden sm:block" />
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
      </section>

      {/* â”€â”€ The board's four promise cards, lifted onto the cover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              <h2 className="font-display text-base font-bold text-charcoal">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;

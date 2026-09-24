import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
const heroPoster = "/hero-korean.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useUpcomingTrialSlots, viewerTimezone } from "@/hooks/useUpcomingTrialSlots";

/**
 * The first screen.
 *
 * 23 Sep 2026, CRO pass: FIVE THINGS, NO MORE - headline, one paragraph, one
 * primary action (Book a Free Class), one proof line, and at most ONE
 * next-class line from real trial_slots data in the visitor's own time zone.
 * The teacher is its own section; the full schedule lives on /free-trial; the
 * Hangul sheet is linked from MoreThanAClass. WhatsApp is the secondary button
 * in Arabic only.
 *
 * HEADLINE SIZE, measured at 375px: at 32px the English headline wrapped to
 * four lines. Phones use clamp(1.625rem, 7vw, 2.25rem), which sets each half
 * on one line; from md up it is clamp(2.25rem, 5vw, 3.75rem) as before. The
 * headline column (5xl) is wider than the paragraph's (2xl) so the halves
 * stay on one line at desktop width too.
 *
 * NUMERALS: the Arabic hero uses Arabic-Indic numerals throughout, because the
 * next-class date line (ar-EG locale) does; it used to mix "8" with "٢٥".
 *
 * The section is dark in BOTH themes (photo under a charcoal scrim), which is
 * why it uses live-bright and ivory/charcoal literals.
 *
 * 24 Sep 2026: the 3D plush Cluby is the only mascot. He waves from the top
 * edge of the end-side promise card (the last card on desktop, the end card of
 * the top row on phones, where standing on the last card would cover the card
 * above it). The first card's flat Klobi became books-stack.
 *
 * 24 Sep 2026 (b): CLUBY'S CLOSET. The same spot now carries a seasonal badge
 * instead of the plain standing cutout - starting with Chuseok (24-26 Sep).
 * Swap CLUBY_BADGE below for the next occasion, or back to cluby-wave.webp
 * for a plain week. See claude/CLUBY_CLOSET_AND_CHUSEOK_2026-09-24.md.
 *
 * 24 Sep 2026 (c): the badge actually jumps - Re wanted Cluby "moving, not
 * just a picture", then "a jumping figure" when a small idle bob wasn't
 * enough. Reuses animate-bar-jump/animate-bar-shadow from src/index.css (the
 * cast animation already written for StickyEnrollBar but unused until now):
 * squash, launch, a turn in the air, land, rest, repeat. No video/animation
 * generation tool is available in this workspace, so this is CSS motion on
 * the existing badge image, not a generated video/GIF.
 *
 * 24 Sep 2026 (d): the round Chuseok crop became a full standing figure -
 * "i want it like this but in hanbok", pointing at cluby-wave.webp's
 * full-body cutout style. cluby-hanbok.webp started as a hand-traced
 * transparent cutout (automated background removal kept grabbing the
 * glowing moon behind Cluby in the source art, since their colors overlap
 * too closely), then Re sent a cleaner version of the same cutout
 * ("better quality") which replaced it - same file name, no jagged edges.
 * The jump-wrapper box below is portrait (~0.77 aspect, matching the
 * current asset's 980x1274) instead of the old square badge box.
 */

/** This week's Cluby image on the hero card. Swap this one line per occasion. */
const CLUBY_BADGE = {
  src: "/assets/cluby/cluby-hanbok.webp",
  width: 980,
  height: 1274,
};

const HeroSection = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { slots } = useUpcomingTrialSlots();

  /**
   * ONE next class. Prefer a slot taught in the visitor's language; fall back
   * to the soonest slot of any language. Null while loading or when nothing
   * is scheduled - the honest rendering of both is to say nothing.
   */
  const nextClass = useMemo(() => {
    const want = isAr ? "ar" : "en";
    const mine = slots.find((s) => (s.language ?? "").toLowerCase().startsWith(want));
    const next = mine ?? slots[0];
    if (!next) return null;
    const tz = viewerTimezone();
    const locale = isAr ? "ar-EG" : "en-US";
    const day = next.startsAt.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric", timeZone: tz });
    const time = next.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
    let zoneName = "";
    try {
      zoneName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
        .formatToParts(next.startsAt)
        .find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch { /* leave it off */ }
    return { day, time, zoneName };
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

  /** The board's four promise cards, under the photo. */
  const cards = [
    {
      icon: "books-stack" as KloverIconName,
      tone: "bg-klovers-yellow",
      title: isAr ? "دروس مرتّبة" : "Structured lessons",
      body: isAr ? "من الهانغول إلى المحادثة" : "From Hangul to real conversations",
    },
    {
      icon: "chat-annyeong" as KloverIconName,
      tone: "bg-white",
      title: isAr ? "تتدرّب مع ناس" : "Practice together",
      body: isAr ? "مجموعات صغيرة مباشرة" : "Small live groups",
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
      title: isAr ? "خطوة واضحة" : "A clear next step",
      body: isAr ? "بعد كل حصة بتعرف الجاية" : "After every class, you know what comes next",
    },
  ];

  const headlineSize = "text-[clamp(1.625rem,7vw,2.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)]";

  return (
    <>
      <section
        id="home"
        className="relative min-h-[86svh] flex flex-col items-center justify-center pt-16 overflow-hidden bg-charcoal"
      >
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

        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(46,46,46,0.6) 0%, rgba(46,46,46,0.35) 45%, rgba(46,46,46,0.65) 100%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] max-w-full rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(60 100% 50% / 0.16) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 text-center pt-8 pb-24 sm:pb-32">
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-5 sm:gap-6">

            {/* 1. Headline. Yellow as TYPE is correct here and only here. */}
            <h1
              className="font-display font-extrabold text-ivory leading-[1.08] tracking-tight w-full"
              style={{ textShadow: "0 4px 40px rgba(20,20,18,0.9), 0 2px 8px rgba(20,20,18,0.8)" }}
            >
              <span className={`block ${headlineSize}`}>
                {isAr ? "ابدأ التحدث بالكورية" : "Start Speaking Korean"}
              </span>
              <span
                className={`block mt-1 ${headlineSize}`}
                style={{ color: "#FFFF00", textShadow: "0 0 60px rgba(255, 255, 0, 0.35), 0 4px 24px rgba(20,20,18,0.7)" }}
              >
                {isAr ? "من حصتك الأولى" : "From Your First Live Class"}
              </span>
            </h1>

            {/* 2. One supporting paragraph. */}
            <p
              className="text-ivory/90 text-base sm:text-lg leading-relaxed max-w-2xl"
              style={{ textShadow: "0 1px 10px rgba(20,20,18,0.85)" }}
            >
              {isAr
                ? "حصص كورية مباشرة أونلاين مع معلمة حقيقية، في مجموعات صغيرة، ومسار واضح من البداية حتى التحدث بثقة."
                : "Live online Korean classes with a real teacher, small groups, and a clear path from beginner to confident conversation."}
            </p>

            {/* 3. The action. */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs sm:max-w-none mx-auto">
              <Button
                size="lg"
                asChild
                className="min-h-12 gap-2.5 text-base font-bold px-10 rounded-full shadow-2xl"
                style={{ boxShadow: "0 0 36px hsl(60 100% 50% / 0.3), 0 8px 24px rgba(20,20,18,0.4)" }}
              >
                <Link
                  to="/free-trial"
                  onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "homepage_hero_free_trial", metadata: { language } }); } catch {} }}
                >
                  <Gift className="h-5 w-5" />
                  {isAr ? "احجز حصتك المجانية" : "Book a Free Class"}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              {isAr && (
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="min-h-12 gap-2.5 text-base font-semibold px-8 rounded-full bg-transparent hover:bg-ivory/10 text-ivory border-2 border-ivory/40 hover:border-ivory/60"
                >
                  <a
                    href={WHATSAPP_BASE}
                    onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "homepage_hero_whatsapp" }); }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    اسألنا على واتساب
                  </a>
                </Button>
              )}
            </div>

            {/* 4. Proof line. */}
            <p className="text-ivory/80 text-sm font-medium" style={{ textShadow: "0 1px 8px rgba(20,20,18,0.8)" }}>
              {isAr
                ? "مجموعات صغيرة · بالعربي أو الإنجليزي · مناسب للمبتدئين"
                : "Small groups · English & Arabic · Beginner friendly"}
            </p>

            {/* 5. ONE next class, in the visitor's own time. */}
            {nextClass && (
              <div className="inline-flex items-center gap-2 bg-charcoal/55 border border-live-bright/40 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs sm:text-sm text-ivory">
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live-bright opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live-bright" />
                </span>
                <span>
                  <span className="font-semibold text-live-bright">{isAr ? "أقرب حصة مجانية:" : "Next free class:"}</span>{" "}
                  {nextClass.day} · {nextClass.time} {isAr ? "بتوقيتك" : "your time"}
                  {nextClass.zoneName && <span className="text-ivory/60"> ({nextClass.zoneName})</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── The board's four promise cards, lifted onto the cover ── */}
      <div className="relative z-20 mx-auto max-w-6xl px-4 -mt-12 pb-12 sm:-mt-20">
        {/* This week's Cluby badge, sitting on the top edge of the end-side
            card and peeking up into the hero. Decorative: the cards carry
            the meaning. See CLUBY_BADGE above to swap it. A real jump loop
            (bar-jump/bar-shadow, both motion-safe) - squash, launch, turn,
            land, rest - not just a static badge. Portrait box (~0.77
            aspect) to match the full-body cutout instead of a square crop. */}
        <div
          className="pointer-events-none absolute bottom-full end-8 z-10 h-[84px] w-[65px] select-none md:end-10 md:h-[120px] md:w-[92px]"
        >
          {/* Ground shadow: shrinks and fades as Cluby leaves the ground. */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 start-1/2 h-[14px] w-[60%] -translate-x-1/2 rounded-full bg-charcoal/45 blur-[3px] motion-safe:animate-bar-shadow rtl:translate-x-1/2"
          />
          <img
            src={CLUBY_BADGE.src}
            alt=""
            aria-hidden="true"
            width={CLUBY_BADGE.width}
            height={CLUBY_BADGE.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="relative h-full w-full select-none object-contain object-bottom drop-shadow-[0_10px_14px_rgba(46,46,46,0.4)] motion-safe:animate-bar-jump"
          />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon, tone, title, body }) => (
            <div
              key={title}
              className={`rounded-2xl border border-charcoal/10 p-4 sm:p-5 ${tone} shadow-[0_18px_40px_-24px_rgba(46,46,46,0.75)]`}
            >
              <KloverIcon name={icon} className="mb-3 h-12 w-12 sm:h-14 sm:w-14" />
              <h3 className="font-display text-sm sm:text-base font-bold text-charcoal">{title}</h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-charcoal/65">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;

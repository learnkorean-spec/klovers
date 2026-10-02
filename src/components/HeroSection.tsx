import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Play } from "lucide-react";
import { Link } from "react-router-dom";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
/*
 * 27 Sep 2026: the photo is now the Klovers world - the two learners and
 * Cluby studying on a hanok porch, Namsan Tower in the sky on the RIGHT.
 * The characters sit left of centre, so from lg up the headline block is
 * pushed to the right-hand sky (physical margin, same in AR and EN), and on
 * phones the crop moves right (object-[97%_center]) so the text lands on sky
 * and roofs instead of faces.
 */
const heroPoster = "/hero-world.jpg";
const heroVideo = "/videos/hero-korea-video-new.mp4";
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
 * ARABIC (25 Sep 2026, brand guard): neutral Modern Standard Arabic. Buttons
 * and card lines use verbal nouns; no verb addresses the reader as male or
 * female, and no Egyptian dialect.
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
  // Halved from 980x1274 on 2026-10-03. The badge's box is 65x84 CSS px, or
  // 92x120 from the md breakpoint up — so the largest it is ever drawn is
  // 276x360 device pixels on a 3x screen. The file was 333 KB of pixels for a
  // box that small; it is 48 KB now, and these are the dimensions the file
  // actually has, so the reserved box stays exact. Ratio is unchanged.
  width: 490,
  height: 637,
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

  /*
   * THE HERO VIDEO IS 32.5 MB AND NOW LOADS ONLY ON A CLICK.
   *
   * It used to start itself two seconds after load, behind three gates
   * (reduced-motion, saveData, and a "not slow" connection test). The gates
   * were right and the default was still wrong: on wifi, without data-saver,
   * every visitor paid 32.5 MB - roughly 160x the weight of every other asset
   * on the page combined - for a loop that plays behind a headline they are
   * trying to read. A gate that most visitors pass is not a gate.
   *
   * So the default is now "not fetched". The poster below carries the same
   * image, so the section is complete without it; the <video> renders with no
   * `src` at all (which is what guarantees no request) and gets one only when
   * someone presses Play. That is also the honest reading of WCAG 2.2.2: the
   * motion is user-initiated, so it needs no pause control.
   *
   * `saveData` hides the button rather than honouring it on click. A visitor
   * who turned data-saver on told the browser, in the only place the browser
   * lets them, not to spend bytes on decoration - and a Play button is an
   * invitation to spend 32.5 of them.
   *
   * Known limit: this cannot make the file smaller. There is no ffmpeg in this
   * workspace, so re-encoding the MP4 to a few MB has to happen off-machine.
   * Until then this is the lever: the video still exists for anyone who wants
   * it, and nobody downloads it by accident.
   */
  const [offerVideo] = useState(() => {
    try {
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      return !conn?.saveData;
    } catch {
      return true;
    }
  });

  const playVideo = () => {
    const video = videoRef.current;
    // `video.src` is "" until the first press, so this is idempotent.
    if (!video || video.src) return;
    video.src = heroVideo;
    video.load();
    video.play().catch(() => {});
  };

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
      tone: "bg-ivory",
      title: isAr ? "تدريب جماعي" : "Practice together",
      body: isAr ? "مجموعات صغيرة مباشرة" : "Small live groups",
    },
    {
      icon: "globe-plane" as KloverIconName,
      tone: "bg-klovers-yellow",
      title: isAr ? "كورية حقيقية" : "Real-life Korean",
      body: isAr ? "لغة يومية وعملية وثقافية" : "Useful, practical, cultural",
    },
    {
      icon: "namsan-tower" as KloverIconName,
      tone: "bg-ivory",
      title: isAr ? "خطوة واضحة" : "A clear next step",
      body: isAr ? "بعد كل حصة تتضح الخطوة التالية" : "After every class, you know what comes next",
    },
  ];

  const headlineSize = "text-[clamp(1.625rem,7vw,2.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)]";

  return (
    <>
      <section
        id="home"
        className="relative min-h-[86svh] flex flex-col items-center justify-center pt-16 overflow-hidden bg-charcoal"
      >
        {/* `decoding="async"` and not "sync": this is the LCP image and sync
            decoding blocks the main thread to paint it. With fetchpriority
            high and the preload in index.html it still arrives first - it
            just no longer stalls everything else to do it. */}
        <img
          src={heroPoster}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover object-[97%_center] lg:object-center transition-opacity duration-1000 motion-safe:animate-ken-burns brightness-110 saturate-[1.15] ${
            videoReady ? "opacity-0" : "opacity-100"
          }`}
        />
        {/* Always rendered, never sourced. A <video> with no `src` makes no
            request, which is what makes "do not fetch 32.5 MB" the default
            rather than a race against a timer. */}
        <video
          ref={videoRef}
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

        {/* THE SCRIM IS THE ONLY THING BETWEEN THE HEADLINE AND THE SKY.
            The mid stop was 0.35, and 0.35 is not enough: sampled from
            hero-world.jpg in the band the text actually occupies, the photo
            behind the headline sits at L≈0.27-0.34, which put the ivory
            paragraph at 2.4-3.4:1 and the yellow headline line at ~2.5:1 -
            under AA for the paragraph, and under even the 3:1 large-text
            threshold for the yellow, which is the single most-read line on
            the page. At 0.55 the same band drops to L≈0.12: the paragraph
            measures 5.2:1 and the yellow line 5.9:1, both clear of AA.
            The top stop comes down from 0.6 to 0.55 so the field above the
            text stays even rather than getting darker than it needs to be. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(46,46,46,0.55) 0%, rgba(46,46,46,0.55) 45%, rgba(46,46,46,0.70) 100%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] max-w-full rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(60 100% 50% / 0.16) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 text-center pt-8 pb-24 sm:pb-32">
          <div className="max-w-5xl mx-auto lg:ml-auto lg:mr-[4%] lg:max-w-2xl flex flex-col items-center gap-5 sm:gap-6">

            {/* 1. Headline. Yellow as TYPE is correct here and only here - the
                ground behind it is the charcoal scrim above, never a light
                surface. It reads from the token now, not a typed "#FFFF00":
                the two happen to be the same colour today, but a hardcoded
                hex means the most prominent line on the page silently stops
                following the brand the day the yellow changes. */}
            <h1
              className="font-display font-extrabold text-ivory leading-[1.08] tracking-tight w-full"
              style={{ textShadow: "0 4px 40px rgba(20,20,18,0.9), 0 2px 8px rgba(20,20,18,0.8)" }}
            >
              <span className={`block ${headlineSize}`}>
                {isAr ? "التحدّث بالكورية يبدأ" : "Start Speaking Korean"}
              </span>
              <span
                className={`block mt-1 ${headlineSize} text-klovers-yellow`}
                style={{ textShadow: "0 0 60px rgba(255, 255, 0, 0.35), 0 4px 24px rgba(20,20,18,0.7)" }}
              >
                {isAr ? "من الحصة الأولى" : "From Your First Live Class"}
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
                  <KloverIcon name="game-lucky-bag" className="h-6 w-6" />
                  {isAr ? "حجز حصة مجانية" : "Book a Free Class"}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
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
                    <MessageCircle className="h-5 w-5 text-klovers-yellow" aria-hidden="true" />
                    السؤال عبر واتساب
                  </a>
                </Button>
              )}
            </div>

            {/* 4. Proof line. */}
            {/* /85, not /80. At /80 this line measured 4.54:1 against the
                darkest band of the photo - passing, but by five hundredths,
                and only after the scrim above was raised. /85 is 4.9:1 and
                costs nothing visually. */}
            <p className="text-ivory/85 text-sm font-medium" style={{ textShadow: "0 1px 8px rgba(20,20,18,0.8)" }}>
              {isAr
                ? "مجموعات صغيرة · بالعربية أو الإنجليزية · مناسبة للمبتدئين"
                : "Small groups · English & Arabic · Beginner friendly"}
            </p>

            {/* 5. ONE next class, in the visitor's own time.

                The chip's scrim is bg-charcoal/75, not /55. It sits on the
                photo, so the scrim is the only thing standing between ivory
                text and a bright sky. At /55 the chip's own background lands
                around L=0.17 over daylight, putting the ivory text at ~4.4:1
                and the muted time-zone suffix near 2.7:1. At /75 the same text
                is ~7:1 and ~4.9:1 - and the section reads the same, because the
                scrim is already blurred and tinted. */}
            {nextClass && (
              <div className="inline-flex items-center gap-2 bg-charcoal/75 border border-live-bright/40 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs sm:text-sm text-ivory">
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live-bright opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live-bright" />
                </span>
                <span>
                  <span className="font-semibold text-live-bright">{isAr ? "أقرب حصة مجانية:" : "Next free class:"}</span>{" "}
                  {nextClass.day} · {nextClass.time} {isAr ? "بالتوقيت المحلي" : "your time"}
                  {nextClass.zoneName && <span className="text-ivory/75"> ({nextClass.zoneName})</span>}
                </span>
              </div>
            )}

            {/* 6. How often the chip can change — and the door that is not
                monthly at all.

                The chip above is honest about the soonest class and silent
                about the one after it. Trial classes run on an
                admin-configured monthly window (supabase/functions/book-trial
                constrains every booking to it), so a visitor who cannot make
                the date shown has no way to tell whether the alternative is
                next week or next quarter — and the honest answer is a month.
                Saying so is the point of this line.

                Deliberately NOT stated here: which days of the month. The
                schedule is configuration, not a constant, so the page that
                reads the live slots off the database (/free-trial) is the page
                that names them. This line carries only what is true whenever
                the window happens to fall.

                Alongside it is the one route that is open every day of the
                month: /placement-test is public, no account, no booking. It is
                what someone who cannot wait a month should be given instead of
                a dead end. */}
            <p
              className="text-ivory/85 text-xs sm:text-sm max-w-2xl"
              style={{ textShadow: "0 1px 8px rgba(20,20,18,0.8)" }}
            >
              {isAr
                ? "الحصص التجريبية تُفتح مرة كل شهر. وإن لم يناسبك هذا الموعد، فاختبار تحديد المستوى مفتوح كل يوم: "
                : "Trial classes open once a month. If this date does not suit you, the placement test is open every day: "}
              <Link
                to="/placement-test"
                onClick={() => { try { logLeadEvent({ source_type: "placement_test", cta_label: "homepage_hero_placement", metadata: { language } }); } catch {} }}
                className="font-semibold text-klovers-yellow underline underline-offset-4 hover:text-klovers-yellow/80"
              >
                {isAr ? "اختبر مستواك الآن" : "Take the placement test"}
              </Link>
            </p>
          </div>
        </div>

        {/* The video's only door. Top-end, under the header and clear of the
            centred content column on every breakpoint, because the button must
            not become a sixth thing competing with the headline, paragraph,
            action, proof line and next-class chip. It disappears once the
            video is playing. */}
        {offerVideo && !videoReady && (
          <button
            type="button"
            onClick={playVideo}
            className="absolute top-24 end-4 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-ivory/35 bg-charcoal/70 px-4 text-xs font-semibold text-ivory backdrop-blur-sm transition-colors hover:border-ivory/60 hover:bg-charcoal/85"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            {isAr ? "تشغيل الفيديو" : "Play video"}
          </button>
        )}
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
              {/* h2, not h3. The document runs h1 (hero) then these four, and
                  MeetTeacher's h2 only arrives after them - so the first
                  heading a screen-reader user met after the h1 skipped a
                  level. These are section-level statements in their own right
                  and they come first, so they take h2. */}
              <h2 className="font-display text-sm sm:text-base font-bold text-charcoal">{title}</h2>
              {/* /80, not /65. The cards alternate bg-klovers-yellow and
                  bg-ivory, and charcoal at 65% over those measures 4.39:1 and
                  4.38:1 - both under AA for text this size. At /80 it is
                  6.9:1 on either. */}
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-charcoal/80">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;

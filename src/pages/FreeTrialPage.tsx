import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { useUpcomingTrialSlots, viewerTimezone } from "@/hooks/useUpcomingTrialSlots";
import { supabase } from "@/integrations/supabase/client";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trustCopy, toArabicDigits } from "@/lib/trustFigures";
import { useLanguage } from "@/contexts/LanguageContext";
import AvatarInitials from "@/components/AvatarInitials";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";

/**
 * Below this many completed trials the count is not shown at all — the whole
 * social-proof cluster is hidden instead.
 *
 * A small true number argues against booking ("3+ students" reads as "nobody
 * comes here"), and zero is worse than small: it is a placeholder that
 * escaped, which is exactly what this page was rendering. See the note on
 * `bookedCount` below for what production actually returns.
 */
const SOCIAL_PROOF_MIN_COUNT = 10;

/** Real student quotes keep their words; only the emoji go (brand rule: no emoji in Klovers UI). */
const noEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}|️/gu, "").replace(/\s{2,}/g, " ").trim();

const FreeTrialPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const tr = (en: string, ar: string) => (isAr ? ar : en);

  // World mode (25 Sep 2026): /free-trial is the Conversation Café, the
  // first stop in the Klovers world (src/config/klovers-world.ts). The copy
  // is inline in both languages: Arabic in Modern Standard Arabic, neutral in
  // gender (verbal nouns on buttons, no verb aimed at the reader as male or
  // female). Icons are the Klovers illustrated set (KloverIcon), no generic
  // icons or emoji. Every fact below is unchanged: 30 minutes, live, free,
  // no card, once a month.
  const PERKS: { icon: KloverIconName; text: string }[] = [
    { icon: "chat-annyeong",  text: tr("Live, with a real teacher", "مباشرة مع معلمة حقيقية") },
    { icon: "calendar-check", text: tr("30 minutes", "ثلاثون دقيقة") },
    { icon: "growth-chart",   text: tr("Your level, found", "تحديد المستوى") },
    { icon: "sprout",         text: tr("Free, no card", "مجانية دون بطاقة") },
  ];

  const STEPS: { icon: KloverIconName; num: string; title: string; text: string }[] = [
    {
      icon: "chat-annyeonghaseyo",
      num: "1",
      title: tr("The first words", "الكلمات الأولى"),
      text: tr(
        "A 30-minute live class with Reham, starting from 안녕하세요.",
        "حصة مباشرة مدتها ثلاثون دقيقة مع ريهام، تبدأ من 안녕하세요.",
      ),
    },
    {
      icon: "growth-chart",
      num: "2",
      title: tr("The right table", "الطاولة المناسبة"),
      text: tr(
        "A short placement check, so the next class starts at the right level.",
        "اختبار قصير لتحديد المستوى، لتبدأ الحصة التالية من المكان الصحيح.",
      ),
    },
    {
      icon: "books-stack",
      num: "3",
      title: tr("The next step", "الخطوة التالية"),
      text: tr(
        "A clear recommendation for what comes next, with no pressure to buy.",
        "توصية واضحة بما يأتي بعد ذلك، دون أي ضغط للشراء.",
      ),
    },
  ];

  /** The real upcoming trial slots, straight from the database. */
  const { slots, loading: slotsLoading } = useUpcomingTrialSlots();

  // Trial slots carry a class language ("arabic" | "english"; null = not set).
  // A slot "matches" the page when it is in the page's language or has none.
  const pageClassLanguage = isAr ? "arabic" : "english";
  const matchesPage = (lang: string | null) => !lang || lang === pageClassLanguage;
  const seatsLeft = (slot: { capacity: number; bookedCount: number }) =>
    Math.max(0, (slot.capacity ?? 0) - (slot.bookedCount ?? 0));

  const SLOT_HIGHLIGHTS = useMemo(() => {
    const locale = isAr ? "ar-EG" : "en-US";
    const tz = viewerTimezone();
    // Page-language slots first (stable: the hook already sorts by start time).
    const ordered = [...slots].sort(
      (a, b) => Number(!matchesPage(a.language)) - Number(!matchesPage(b.language)),
    );
    return ordered.map((slot) => ({
      key: `${slot.date}-${slot.startTime}-${slot.language ?? "any"}`,
      day: slot.startsAt.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric", timeZone: tz }),
      time: slot.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }),
      languageLabel:
        slot.language === "arabic"
          ? (isAr ? "الحصة بالعربية" : "Class in Arabic")
          : slot.language === "english"
            ? (isAr ? "الحصة بالإنجليزية" : "Class in English")
            : null,
      isFull: seatsLeft(slot) === 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, isAr]);

  // Live seats remaining for the page's class language only, over open slots.
  const pageSlotsOpen = useMemo(
    () => slots.filter((s) => matchesPage(s.language) && seatsLeft(s) > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, isAr],
  );
  const spotsRemaining: number | null =
    slotsLoading || pageSlotsOpen.length === 0
      ? null
      : pageSlotsOpen.reduce((sum, s) => sum + seatsLeft(s), 0);
  // Deadline = earliest open page-language slot date minus 1 day (booking cutoff).
  const daysToDeadline: number | null = (() => {
    const earliest = pageSlotsOpen[0]?.date;
    if (!earliest) return null;
    const deadlineMs = new Date(earliest + "T00:00:00Z").getTime() - 86_400_000;
    return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 86_400_000));
  })();

  const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
    {
      quote: noEmoji(t("freeTrial.testimonial1Quote")),
      name:  t("freeTrial.testimonial1Name"),
      role:  t("freeTrial.testimonial1Role"),
    },
    {
      quote: noEmoji(t("freeTrial.testimonial2Quote")),
      name:  t("freeTrial.testimonial2Name"),
      role:  t("freeTrial.testimonial2Role"),
    },
  ];

  useSEO({
    title: isAr ? "حجز حصة كورية مجانية" : "Book Your Free Korean Class",
    description: isAr
      ? "حصة كورية مباشرة مجانية مدتها ٣٠ دقيقة مع معلّمة حقيقية، بالعربية أو بالإنجليزية، ودون بطاقة دفع."
      : "Try a free 30-minute live Korean class at Klovers, in English or Arabic. A real teacher, no credit card.",
    canonical: "https://kloversegy.com/free-trial",
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    // /ar/free-trial carries the same three blocks in Arabic, pointing at the
    // Arabic URLs (28 Sep 2026). Same facts as the visible page.
    const home = isAr ? "https://kloversegy.com/ar" : "https://kloversegy.com";
    const pageUrl = isAr ? "https://kloversegy.com/ar/free-trial" : "https://kloversegy.com/free-trial";
    const brand = isAr ? "كلوفرز" : "Klovers";
    el.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": isAr ? "الرئيسية" : "Home", "item": home },
          { "@type": "ListItem", "position": 2, "name": isAr ? "حصة كورية تجريبية مجانية" : "Free Korean Trial Class", "item": pageUrl },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": isAr ? "حصة كورية تجريبية مجانية" : "Free Trial Korean Class",
        "description": isAr
          ? "حصة كورية مباشرة مدتها ٣٠ دقيقة مع معلّمة حقيقية. مجانية ودون بطاقة دفع."
          : "30-minute live Korean class with a real teacher. Free, no credit card required.",
        "provider": { "@type": "Organization", "name": brand, "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": isAr ? "حصة تجريبية مجانية" : "Free Trial" },
        "inLanguage": "ko",
        "url": pageUrl,
        ...(slots.length > 0
          ? {
              "hasCourseInstance": slots.map((slot) => ({
                "@type": "CourseInstance",
                "courseMode": "online",
                "startDate": slot.startsAt.toISOString(),
                "endDate": new Date(slot.startsAt.getTime() + slot.durationMin * 60000).toISOString(),
              })),
            }
          : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": isAr ? "حصة كورية تجريبية مجانية — كلوفرز" : "Free Korean Trial Class — Klovers",
        "description": isAr
          ? "حصة كورية مباشرة مدتها ٣٠ دقيقة مع معلّمة حقيقية. مجانية ودون بطاقة دفع."
          : "Join a 30-minute live Korean class with a real teacher. Free, no credit card needed.",
        "url": pageUrl,
        "inLanguage": isAr ? "ar" : "en",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "organizer": { "@type": "Organization", "name": brand, "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "validFrom": new Date().toISOString() },
        "location": { "@type": "VirtualLocation", "url": pageUrl },
      },
    ]);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [slots, isAr]);

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get("ref") || "";

  // Live booking count for social proof.
  //
  // ⚠️ This renders as "N+ students". There was no floor, so a count of 0
  // rendered the literal string "0+ students" on the main conversion page —
  // the placeholder the UX audit caught (plan item P0-7).
  //
  // It is not hypothetical and it is not a staging artefact. Measured against
  // production on 2026-09-08, `trial_bookings` held 57 rows at status
  // 'pending' and 19 at 'cancelled', and ZERO at 'confirmed' or 'completed'.
  // This query therefore returned exactly 0, and every visitor to /free-trial
  // was told that 0+ students had taken the class.
  //
  // The filter is deliberately NOT widened to include 'pending'. Those 57
  // students booked; nothing in the data says they attended, and "57+
  // students" would be a claim the database does not support. Why no booking
  // ever reaches 'confirmed' or 'completed' is a pipeline question, and it is
  // not answered by changing what this page says.
  //
  // The old fallback for "no live number" was t("freeTrial.socialCount"),
  // which is the hardcoded string "500+". Falling back to that would have
  // swapped a placeholder that undersells for a claim that oversells: the
  // database holds 102 profiles, 76 trial bookings and 25 enrolments in
  // total. So when there is no supportable number the cluster is hidden
  // rather than filled in. Nothing is lost by declining to make a claim.
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  useEffect(() => {
    supabase
      .from("trial_bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "completed"])
      .then(({ count }) => { if (count !== null) setBookedCount(count); });
  }, []);

  // Spots remaining + nearest deadline are derived from `slots` above
  // (page class language only, full slots excluded).


  useEffect(() => {
    if (referredBy) {
      try { localStorage.setItem("referrer_id", referredBy); } catch {}
      supabase.functions.invoke("track-referral-click", { body: { referrerId: referredBy } }).catch(() => {});
    }
  }, [referredBy]);

  // Fire landing_viewed only after 50% scroll depth — reduces noise vs page load
  useEffect(() => {
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.5) {
        fired = true;
        logLeadEvent({ source_type: "free_trial", cta_label: "landing_viewed" });
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBookCta = () => {
    logLeadEvent({ source_type: "free_trial", cta_label: "free_trial_landing_primary" });
    if (loading) return;
    // Everyone goes straight to the booking page (24 Sep 2026). A guest books
    // there with name + email; no account or password first.
    navigate("/trial-booking");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">

        {/* ── HERO: the Conversation Café ── */}
        <section className="py-16 md:py-24 border-b border-border overflow-hidden bg-ivory dark:bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-12 items-center">

              {/* Text column */}
              <div className="text-center md:text-start">

                {/* World eyebrow. The live dot shows only while this page's
                    class language has an open slot with a free seat. */}
                <span className="inline-flex items-center gap-2 bg-klovers-yellow border-2 border-charcoal text-charcoal text-xs font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-5">
                  {!slotsLoading && pageSlotsOpen.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-klovers-green animate-pulse" aria-hidden="true" />
                  )}
                  {tr("Conversation Café · the first stop", "مقهى المحادثة · المحطة الأولى")}
                </span>

                <h1 className="font-display text-5xl md:text-7xl font-black text-foreground leading-[0.95] tracking-tight mb-5">
                  {tr("Your first Korean class,", "أول حصة كورية")}
                  <br />
                  <span className="relative inline-block mt-2">
                    <span className="absolute -inset-x-2 -inset-y-1 bg-klovers-yellow -skew-x-2 rounded-lg" aria-hidden="true" />
                    <span className="relative text-charcoal">{tr("free", "مجانًا")}</span>
                  </span>
                </h1>

                <p className="text-base md:text-xl text-muted-foreground max-w-md mb-4 mx-auto md:mx-0 leading-relaxed">
                  {tr(
                    "Two friends, one café table, and the first Korean word they ever said out loud. The first class is that same table: 30 minutes, live, with Reham.",
                    "صديقان، وطاولة في مقهى، وأول كلمة كورية قيلت بصوتٍ مسموع. الحصة الأولى هي الطاولة نفسها: ثلاثون دقيقة مباشرة مع ريهام.",
                  )}
                </p>

                {/* Rating: the sourced Google figure from @/lib/trustFigures */}
                <p className="text-sm font-semibold text-foreground mb-8">{trustCopy(language).rating}</p>

                {/* CTA */}
                <div className="flex flex-col items-center md:items-start gap-3 justify-center md:justify-start">
                  <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
                    <Button
                      size="lg"
                      onClick={handleBookCta}
                      className="text-base font-bold h-14 px-8 shadow-xl hover:scale-[1.02] transition-transform"
                      aria-label={tr("Book the free Korean trial class", "حجز الحصة التجريبية المجانية")}
                    >
                      {tr("Book the free class", "حجز الحصة المجانية")}
                    </Button>

                    {/* Social proof: shown only when the live count supports it.
                        See SOCIAL_PROOF_MIN_COUNT. No invented avatars. */}
                    {bookedCount !== null && bookedCount >= SOCIAL_PROOF_MIN_COUNT && (
                      <p className="text-sm font-black text-foreground leading-tight self-center">
                        {isAr ? `${bookedCount}+ حضروا الحصة التجريبية` : `${bookedCount}+ have taken the trial`}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center md:text-start">
                    {user
                      ? tr("Signed in. The dates are on the next page.", "تم تسجيل الدخول، والمواعيد في الصفحة التالية.")
                      : tr("No account or card needed: a name and an email are enough.", "لا حاجة إلى حساب أو بطاقة، يكفي الاسم والبريد الإلكتروني.")}
                  </p>

                  {/* Live availability. Computed, not copy: capacity minus
                      booked_count summed over get_trial_availability.
                      Colours (Re, 25 Sep 2026): yellow chip, charcoal type,
                      neon-green live dot. */}
                  {(spotsRemaining !== null || daysToDeadline !== null) && (
                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start" aria-live="polite" aria-atomic="false">
                      {spotsRemaining !== null && spotsRemaining <= 15 && (
                        <span className="inline-flex items-center gap-1.5 bg-klovers-yellow text-charcoal border-2 border-charcoal text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-klovers-green animate-pulse" aria-hidden="true" />
                          {isAr
                            ? `الأماكن المتبقية في الحصص بالعربية: ${toArabicDigits(spotsRemaining)}`
                            : `${spotsRemaining} ${spotsRemaining === 1 ? "spot" : "spots"} left in English classes`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Perks, with the Klovers illustrated icons on ivory tiles */}
                <ul className="flex flex-wrap gap-2 mt-8 justify-center md:justify-start">
                  {PERKS.map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-2 bg-card border border-border rounded-full ps-1.5 pe-3 py-1 text-xs font-semibold text-foreground">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ivory">
                        <KloverIcon name={icon} className="h-6 w-6" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* The story scene: the two friends and Cluby at the café table,
                  with Cluby's note (his voice only, .cluby-note). */}
              <div className="relative mx-auto w-full max-w-sm md:max-w-none">
                {/* Cluby's note sits above the picture, never on top of it. */}
                <div className="mb-3 ms-auto w-fit max-w-[15rem] rounded-2xl border-2 border-charcoal bg-ivory px-4 py-2 text-charcoal shadow-md">
                  <p className="cluby-note">
                    <span lang="ko" dir="ltr" className="font-ko font-bold">안녕!</span>{" "}
                    {tr("The seat next to me is still free.", "المقعد بجانبي ما زال فارغًا.")}
                  </p>
                </div>
                <img
                  src="/assets/cluby/cafe.webp"
                  alt={tr(
                    "Two friends and Cluby studying Korean together at a café table",
                    "صديقان مع كلوبي يدرسون الكورية معًا على طاولة في مقهى",
                  )}
                  width={1200}
                  height={800}
                  decoding="async"
                  className="aspect-[4/5] w-full rounded-3xl border border-foreground/10 object-cover shadow-[0_24px_50px_-30px_rgba(46,46,46,0.7)]"
                />
                <div className="absolute -bottom-4 start-4 rounded-2xl bg-charcoal px-4 py-3 text-ivory shadow-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-klovers-yellow">{tr("Free trial", "حصة تجريبية")}</p>
                  <p className="text-sm font-black leading-tight">{tr("No credit card", "دون بطاقة بنكية")}</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── WHAT HAPPENS AT THE TABLE ── */}
        <section className="py-20 bg-charcoal">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-klovers-yellow mb-2">
              {tr("30 minutes at the café", "ثلاثون دقيقة في المقهى")}
            </p>
            <h2 className="font-display text-3xl font-black text-ivory text-center mb-12">
              {tr("Three moments at the table", "ثلاث لحظات على الطاولة")}
            </h2>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ivory/10 border border-ivory/10 rounded-3xl overflow-hidden">
              {STEPS.map(({ icon, num, title, text }) => (
                <li key={num} className="flex flex-col items-start gap-4 bg-charcoal p-8">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl font-black text-klovers-yellow leading-none">{num}</span>
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ivory">
                      <KloverIcon name={icon} className="h-10 w-10" />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ivory">{title}</h3>
                  <p className="text-sm text-ivory/75 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── HEARD AT THE CAFÉ: real student reviews, their own words ── */}
        <section className="py-16 bg-muted/40 border-b border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-display text-2xl font-black text-foreground text-center mb-8">
              {tr("Heard at the café", "من أحاديث المقهى")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t_) => (
                <figure key={t_.name} className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <blockquote className="text-sm text-foreground leading-relaxed flex-1">
                    "{t_.quote}"
                  </blockquote>
                  <figcaption className="flex items-center gap-3 pt-2 border-t border-border">
                    <AvatarInitials name={t_.name} size={36} />
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{t_.name}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{t_.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── PICK A TABLE: the real upcoming slots ── */}
        <section className="py-20 pb-28">
          <div className="container mx-auto px-4 max-w-xl">

            <div className="text-center mb-10">
              <KloverIcon name="calendar-blossom" className="mx-auto mb-3 h-14 w-14" />
              <h2 className="font-display text-3xl font-black text-foreground mb-2">
                {tr("Pick a table", "اختيار الموعد")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {/* The cadence is a rule, not a shortage, and it reads as one.
                    Source: supabase/migrations/20260919150000_monthly_trial_weekend.sql
                    — Re, 19 Sep 2026: trials run on the first Friday and the
                    first Saturday of the month. Said without a count of seats,
                    because that is configuration (trial_settings.capacity) and
                    this page reads the live slots rather than assuming it. */}
                {tr(
                  "Trial classes open once a month, on the first Friday and Saturday, and run as real small-group classes — so the number of seats is small. Times are shown in your own time zone.",
                  "تُفتح الحصص التجريبية مرة كل شهر، في أول جمعة وسبت منه، وتُدار كحصص حقيقية في مجموعات صغيرة — لذلك يكون عدد المقاعد محدودًا. والأوقات معروضة بالتوقيت المحلي.",
                )}
              </p>
            </div>

            {/* Ticket cards: 1 column on mobile, 2 on desktop. Skeleton while
                loading; an honest empty state when nothing is open. */}
            {slotsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" aria-hidden="true">
                {[0, 1].map((i) => (
                  <div key={i} className="border-2 border-border rounded-2xl overflow-hidden animate-pulse">
                    <div className="bg-muted h-9" />
                    <div className="bg-background h-[76px]" />
                  </div>
                ))}
              </div>
            ) : SLOT_HIGHLIGHTS.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8">
                <p className="text-sm font-semibold text-foreground mb-1">
                  {tr("The next month's tables are not open yet.", "مواعيد الشهر القادم لم تُفتح بعد.")}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {tr(
                    "A WhatsApp message is enough to hold the first seat that opens.",
                    "رسالة على واتساب تكفي لحجز أول مقعد يُفتح.",
                  )}
                </p>
                {/* Two ways on, because this is the one screen where a
                    visitor can do nothing at all. Waiting for the next month
                    is one answer; the placement test is the other, and it is
                    the only thing on this page that is open on every date
                    rather than one weekend a month. Without it the honest
                    reading of this box is "come back later". */}
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full font-bold sm:w-auto"
                    onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "free_trial_no_slots_whatsapp" })}
                  >
                    {tr("Message on WhatsApp", "مراسلة على واتساب")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full min-h-11 font-semibold sm:w-auto"
                    onClick={() => {
                      try { logLeadEvent({ source_type: "placement_test", cta_label: "free_trial_no_slots_placement" }); } catch {}
                      navigate("/placement-test");
                    }}
                  >
                    {tr("Or take the placement test", "أو البدء باختبار تحديد المستوى")}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {tr(
                    "The placement test is open every day and needs no booking.",
                    "اختبار تحديد المستوى مفتوح كل يوم ولا يحتاج حجزًا.",
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {SLOT_HIGHLIGHTS.map((s) => (
                  <div
                    key={s.key}
                    aria-disabled={s.isFull || undefined}
                    className={`border-2 border-foreground rounded-2xl overflow-hidden ${
                      s.isFull
                        ? "opacity-60 pointer-events-none select-none"
                        : "shadow-[4px_4px_0px_0px_hsl(var(--charcoal))] dark:shadow-none"
                    }`}
                  >
                    <div className="bg-charcoal py-2.5 px-4 text-center">
                      <p className="text-xs font-black text-klovers-yellow uppercase tracking-widest">{s.day}</p>
                    </div>
                    <div className="relative flex items-center bg-background">
                      <div className="absolute -left-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                      <div className="flex-1 border-t-2 border-dashed border-foreground/25 mx-1" />
                      <div className="absolute -right-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                    </div>
                    <div className="bg-background py-5 px-4 text-center">
                      <p className={`text-2xl font-black text-foreground ${s.isFull ? "line-through" : ""}`}>{s.time}</p>
                      {s.languageLabel && (
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.languageLabel}</p>
                      )}
                      {s.isFull && (
                        <span className="mt-2 inline-block rounded-full border-2 border-foreground bg-muted px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                          {tr("Full", "مكتمل")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              size="lg"
              onClick={handleBookCta}
              className="w-full text-base font-bold h-14 shadow-xl hover:scale-[1.01] transition-transform"
              aria-label={tr("Book the free Korean trial class", "حجز الحصة التجريبية المجانية")}
            >
              {tr("Save a seat at the table", "حجز مقعد على الطاولة")}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {tr(
                "The trial class is free: nothing to pay, no card needed.",
                "الحصة التجريبية مجانية، دون دفع ودون بطاقة بنكية.",
              )}
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;

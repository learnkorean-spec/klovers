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
import { trustCopy } from "@/lib/trustFigures";
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

  const SLOT_HIGHLIGHTS = useMemo(() => {
    const locale = isAr ? "ar-EG" : "en-US";
    const tz = viewerTimezone();
    return slots.map((slot) => ({
      day: slot.startsAt.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric", timeZone: tz }),
      time: slot.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }),
    }));
  }, [slots, isAr]);

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
    title: "Book Your Free Korean Class | Klovers Academy",
    description: "Try a free 30-minute live Korean class at Klovers, in English or Arabic. A real teacher, no credit card.",
    canonical: "https://kloversegy.com/free-trial",
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kloversegy.com" },
          { "@type": "ListItem", "position": 2, "name": "Free Korean Trial Class", "item": "https://kloversegy.com/free-trial" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "Free Trial Korean Class",
        "description": "30-minute live Korean class with a real teacher. Free, no credit card required.",
        "provider": { "@type": "Organization", "name": "Klovers", "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": "Free Trial" },
        "inLanguage": "ko",
        "url": "https://kloversegy.com/free-trial",
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
        "name": "Free Korean Trial Class — Klovers Academy",
        "description": "Join a 30-minute live Korean class with a real teacher. Free, no credit card needed.",
        "url": "https://kloversegy.com/free-trial",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "organizer": { "@type": "Organization", "name": "Klovers", "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "validFrom": new Date().toISOString() },
        "location": { "@type": "VirtualLocation", "url": "https://kloversegy.com/free-trial" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Is the trial class really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — completely free, no credit card required. You attend a 30-minute live class with a real teacher." } },
          { "@type": "Question", "name": "What level do I need to be?", "acceptedAnswer": { "@type": "Answer", "text": "Any level is welcome. Most students start from zero (Hangul). The teacher will assess your level during the class." } },
          { "@type": "Question", "name": "When are the trial classes?", "acceptedAnswer": { "@type": "Answer", "text": "Free trial classes run on the first Friday and Saturday of each month, in Arabic and in English. The booking page shows the next dates in your own timezone." } },
          { "@type": "Question", "name": "How do I book?", "acceptedAnswer": { "@type": "Answer", "text": "Click 'Book My Free Class', choose a day, and confirm. You'll receive an email with the class link and a Google Calendar invite." } },
          { "@type": "Question", "name": "What happens after the trial?", "acceptedAnswer": { "@type": "Answer", "text": "After your trial you'll receive a level recommendation and pricing options if you'd like to continue with a full course." } },
        ],
      },
    ]);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [slots]);

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

  // Live spots remaining across all upcoming slots (summed) + nearest deadline
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const [daysToDeadline, setDaysToDeadline] = useState<number | null>(null);
  useEffect(() => {
    supabase.rpc("get_trial_availability").then(({ data }) => {
      if (!data || data.length === 0) return;
      const total = (data as { booked_count: number; capacity: number; next_trial_date: string }[])
        .reduce((sum, row) => sum + (row.capacity - row.booked_count), 0);
      setSpotsRemaining(total);
      // Deadline = earliest next_trial_date minus 1 day (booking cutoff)
      const earliest = data[0].next_trial_date as string;
      if (earliest) {
        const deadlineMs = new Date(earliest + "T00:00:00Z").getTime() - 86_400_000;
        const days = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 86_400_000));
        setDaysToDeadline(days);
      }
    });
  }, []);


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

                {/* World eyebrow, with the live dot: trials really are open */}
                <span className="inline-flex items-center gap-2 bg-klovers-yellow border-2 border-charcoal text-charcoal text-xs font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-5">
                  <span className="w-2 h-2 rounded-full bg-klovers-green animate-pulse" aria-hidden="true" />
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
                            ? `الأماكن المتبقية: ${spotsRemaining}`
                            : `${spotsRemaining} ${spotsRemaining === 1 ? "spot" : "spots"} left`}
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
                {tr(
                  "Trial classes open once a month, on the first Friday and Saturday. Times are shown in your own time zone.",
                  "تُفتح الحصص التجريبية مرة كل شهر، في أول جمعة وسبت منه. والأوقات معروضة بالتوقيت المحلي.",
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
                <Button
                  variant="outline"
                  className="font-bold"
                  onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "free_trial_no_slots_whatsapp" })}
                >
                  {tr("Message on WhatsApp", "مراسلة على واتساب")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {SLOT_HIGHLIGHTS.map((s, i) => (
                  <div
                    key={i}
                    className="border-2 border-foreground rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_hsl(var(--charcoal))] dark:shadow-none"
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
                      <p className="text-2xl font-black text-foreground">{s.time}</p>
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

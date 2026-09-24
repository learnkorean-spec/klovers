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
import { Gift, Users, Clock, Star, ArrowRight, Video, ClipboardList, Sparkles, CalendarDays, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AvatarInitials from "@/components/AvatarInitials";

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

const Stars = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
    ))}
  </div>
);

const FreeTrialPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const PERKS = [
    { icon: Gift,  text: t("freeTrial.perkFree") },
    { icon: Users, text: t("freeTrial.perkLive") },
    { icon: Clock, text: t("freeTrial.perkDuration") },
    { icon: Star,  text: t("freeTrial.perkAssessment") },
  ];

  const STEPS = [
    { icon: Video,         num: "1", text: t("trialBooking.expectItem1") },
    { icon: ClipboardList, num: "2", text: t("trialBooking.expectItem2") },
    { icon: Sparkles,      num: "3", text: t("trialBooking.expectItem3") },
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
      quote: t("freeTrial.testimonial1Quote"),
      name:  t("freeTrial.testimonial1Name"),
      role:  t("freeTrial.testimonial1Role"),
    },
    {
      quote: t("freeTrial.testimonial2Quote"),
      name:  t("freeTrial.testimonial2Name"),
      role:  t("freeTrial.testimonial2Role"),
    },
  ];

  useSEO({
    title: "Book Your Free Korean Class | Klovers Academy",
    description: "Watch your favourite K-dramas without subtitles. Try a live Korean class for free — real teacher, no credit card, 30 minutes.",
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
        "provider": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
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
        "organizer": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "validFrom": new Date().toISOString() },
        "location": { "@type": "VirtualLocation", "url": "https://kloversegy.com/free-trial" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Is the trial class really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — completely free, no credit card required. You attend a 30-minute live class with a real teacher." } },
          { "@type": "Question", "name": "What level do I need to be?", "acceptedAnswer": { "@type": "Answer", "text": "Any level is welcome. Most students start from zero (Hangul). The teacher will assess your level during the class." } },
          { "@type": "Question", "name": "When are the trial classes?", "acceptedAnswer": { "@type": "Answer", "text": "New trial sessions open every week. The booking page always shows the next available dates, automatically converted to your own timezone." } },
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

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="py-16 md:py-24 border-b border-border overflow-hidden">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-12 items-center">

              {/* Text column */}
              <div className="text-center md:text-start">

                {/* Live badge */}
                <span className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-foreground text-xs font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-klovers-green animate-pulse" />
                  {t("freeTrial.badge")}
                </span>

                {/* Headline — "Free" in yellow with outline */}
                <h1 className="text-6xl md:text-8xl font-black text-foreground leading-[0.88] tracking-tight mb-5">
                  {t("freeTrial.heroTitle1")}
                  <br />
                  <span className="relative inline-block mt-1">
                    <span className="absolute -inset-x-2 -inset-y-1 bg-primary -skew-x-2 rounded-lg" aria-hidden />
                    <span className="relative text-primary text-outlined-lg">{t("freeTrial.heroTitleFree")}</span>
                  </span>
                </h1>

                {/* Emotional subtitle */}
                <p className="text-base md:text-xl text-muted-foreground max-w-md mb-6 mx-auto md:mx-0 leading-relaxed">
                  {t("freeTrial.heroSubtitleEmotional")}
                </p>

                {/* Star rating — the sourced Google figure from @/lib/trustFigures.
                    It read "5.0 · Rated by 200+ students" (freeTrial.ratingText):
                    200 students did not review anything; 7 people did, on Google. */}
                <div className="flex items-center gap-2 justify-center md:justify-start mb-8">
                  <Stars />
                  <span className="text-sm font-semibold text-foreground">{trustCopy(language).rating}</span>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center md:items-start gap-3 justify-center md:justify-start">
                  {!user && (
                    <p className="text-xs text-muted-foreground text-center md:text-start">
                      {t("freeTrial.noteSignedOut")}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
                    <Button
                      size="lg"
                      onClick={handleBookCta}
                      className="gap-2 text-base font-bold h-14 px-8 shadow-xl hover:scale-[1.02] transition-transform"
                      aria-label="Book your free Korean trial class"
                    >
                      {t("freeTrial.cta")}
                      <ArrowRight className="h-5 w-5" />
                    </Button>

                    {/* Inline social proof — shown only when the live count
                        supports it. See SOCIAL_PROOF_MIN_COUNT. */}
                    {bookedCount !== null && bookedCount >= SOCIAL_PROOF_MIN_COUNT && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {["S","M","H","Y","A"].map((l) => (
                            <div key={l} className="w-8 h-8 rounded-full bg-foreground border-2 border-background flex items-center justify-center text-[10px] font-black text-background">{l}</div>
                          ))}
                        </div>
                        <div className="text-start">
                          <p className="text-sm font-black text-foreground leading-tight">
                            {`${bookedCount}+ students`}
                          </p>
                          <p className="text-xs text-muted-foreground leading-tight">{t("freeTrial.socialCountText")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {user && (
                    <p className="text-xs text-muted-foreground text-center md:text-start">
                      {t("freeTrial.noteSignedIn")}
                    </p>
                  )}

                  {/* Live availability chips. Both are computed, not copy: the
                      spots figure is capacity minus booked_count summed over
                      get_trial_availability, and the deadline is the earliest
                      next_trial_date minus the 1-day booking cutoff the slot
                      query enforces. That is why "Booking closes ..." stays
                      while the static scarcity line further down went.
                      Colours are the Klovers palette: our red for spots left,
                      charcoal + yellow for the deadline. */}
                  {(spotsRemaining !== null || daysToDeadline !== null) && (
                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start" aria-live="polite" aria-atomic="false">
                      {spotsRemaining !== null && spotsRemaining <= 15 && (
                        <span className="inline-flex items-center gap-1 bg-[#FF3131] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} left
                        </span>
                      )}
                      {daysToDeadline !== null && (
                        <span className="inline-flex items-center gap-1 bg-foreground text-primary text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          {daysToDeadline === 0
                            ? "Booking closes today"
                            : daysToDeadline === 1
                            ? "Booking closes tomorrow"
                            : `Booking closes in ${daysToDeadline} days`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Perks chips */}
                <div className="flex flex-wrap gap-2 mt-8 justify-center md:justify-start">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary flex-shrink-0">
                        <Icon className="h-3 w-3 text-foreground" />
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* The story scene: the two friends and Cluby studying Korean at a
                  café table (the same art as the homepage's How it works), so
                  this page speaks in the same style as the rest of Klovers. */}
              <div className="relative mx-auto w-full max-w-sm md:max-w-none">
                <img
                  src="/assets/cluby/cafe.webp"
                  alt={isAr ? "صديقان مع كلوبي بيذاكروا الكورية على ترابيزة في كافيه" : "Two friends and Cluby studying Korean together at a café table"}
                  width={1200}
                  height={800}
                  decoding="async"
                  className="aspect-[4/5] w-full rounded-3xl border border-foreground/10 object-cover shadow-[0_24px_50px_-30px_rgba(46,46,46,0.7)]"
                />
                <div className="absolute -bottom-4 start-4 rounded-2xl bg-foreground px-4 py-3 text-background shadow-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{isAr ? "حصة تجريبية" : "Free Trial"}</p>
                  <p className="text-sm font-black leading-tight">{isAr ? "من غير كارت بنكي" : "No credit card"}</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────── */}
        <section className="py-16 bg-muted/40 border-b border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-black text-foreground text-center mb-8">
              {t("freeTrial.testimonialsTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t_) => (
                <div key={t_.name} className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <Stars />
                  <p className="text-sm text-foreground leading-relaxed flex-1">
                    "{t_.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <AvatarInitials name={t_.name} size={36} />
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{t_.name}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{t_.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT TO EXPECT — dark ───────────────────────── */}
        <section className="py-20 bg-foreground">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-black text-background text-center mb-12">
              {t("freeTrial.whatToExpectTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden">
              {STEPS.map(({ icon: Icon, num, text }) => (
                <div key={num} className="flex flex-col items-start gap-5 bg-foreground hover:bg-white/5 transition-colors p-8 group">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl font-black text-primary leading-none">{num}</span>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-background" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-background/75 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCHEDULE — ticket style ─────────────────────── */}
        <section className="py-20 pb-28">
          <div className="container mx-auto px-4 max-w-xl">

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-3xl font-black text-foreground">{t("freeTrial.slotsTitle")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t("freeTrial.slotsSubtitle")}</p>
            </div>

            {/* Ticket cards — 1-col mobile, 2-col desktop. The list is empty
                while the fetch is in flight, and empty again if trial_slots
                genuinely has nothing upcoming. Neither case should render a
                heading over a hole, which is what it did before. */}
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
                  {isAr ? "مواعيد الأسبوع الجاي لسه بتتفتح." : "Next week's sessions are still opening up."}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {isAr
                    ? "ابعتلنا على واتساب ونحجزلك أول ميعاد بيفتح."
                    : "Message us on WhatsApp and we'll hold you the first seat that opens."}
                </p>
                <Button
                  variant="outline"
                  className="gap-2 font-bold"
                  onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "free_trial_no_slots_whatsapp" })}
                >
                  <MessageCircle className="h-4 w-4" />
                  {isAr ? "واتساب" : "WhatsApp Us"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {SLOT_HIGHLIGHTS.map((s, i) => (
                  <div
                    key={i}
                    className="border-2 border-foreground rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_black] hover:shadow-[2px_2px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 cursor-default"
                  >
                    {/* Header */}
                    <div className="bg-foreground py-2.5 px-4 text-center">
                      <p className="text-xs font-black text-primary uppercase tracking-widest">{s.day}</p>
                    </div>
                    {/* Perforated divider */}
                    <div className="relative flex items-center bg-background">
                      <div className="absolute -left-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                      <div className="flex-1 border-t-2 border-dashed border-foreground/25 mx-1" />
                      <div className="absolute -right-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                    </div>
                    {/* Body */}
                    <div className="bg-background py-5 px-4 text-center">
                      <p className="text-2xl font-black text-foreground">{s.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 24 Sep 2026: the orange "Spots are limited — classes fill up
                fast" line (freeTrial.urgency) that sat here is gone. It was
                static copy shown whatever the slots held; the live "N spots
                left" chip in the hero is the true version of it. */}

            <Button
              size="lg"
              onClick={handleBookCta}
              className="w-full gap-2 text-base font-bold h-14 shadow-xl hover:scale-[1.01] transition-transform"
              aria-label="Book your free Korean trial class"
            >
              {t("freeTrial.ctaSecondary")}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {user ? t("freeTrial.noteSignedIn") : t("freeTrial.noteSignedOut")}
            </p>

            {/* Trust guarantee */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <span className="text-green-600 font-bold">✓</span>
              <span>{isAr ? "إذا ما عجبتكش الحصة الأولى — هنرجعلك فلوسك أو نعيد الحجز بدون أسئلة." : "If your first class isn't great, we'll refund or rebook — no questions asked."}</span>
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;

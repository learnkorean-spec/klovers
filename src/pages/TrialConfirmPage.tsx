import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, ClipboardList, Clock, Tag, Video, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";

type PageState = "loading" | "ready" | "responding" | "success" | "already" | "error";
type Answer = "yes" | "no";

interface BookingInfo {
  first_name: string | null;
  trial_date: string | null;
  start_time: string | null;
  timezone: string | null;
  class_language: string | null;
  is_tba: boolean | null;
  attendance_response: string | null;
}

/**
 * A session this student may choose between: same language, active, ahead of
 * today, with room. Her current one is always in the list even at zero seats,
 * because her own booking is what filled it.
 */
interface SlotOption {
  slot_id: string;
  trial_date: string | null;
  start_time: string | null;
  timezone: string | null;
  duration_min: number | null;
  seats_left: number | null;
  is_current: boolean | null;
}

/**
 * This page in the reader's own language.
 *
 * It was English only. An Arabic-track student was sent an Arabic invitation,
 * pressed an Arabic button, and landed on a page that said "Please confirm
 * you'll be attending this trial class" — at the exact moment the academy is
 * asking them to commit, and before they have met anyone.
 *
 * The language comes from the booking itself (`class_language`), not from the
 * browser: it is the language the class will be taught in, which is what the
 * letter was written in and what this reader chose. A student with an English
 * browser who booked the Arabic cohort should read Arabic here.
 */
const COPY = {
  en: {
    dir: "ltr" as const,
    lang: "en",
    locale: "en-US",
    tagline: "Korean Language Academy",
    loading: "Loading your trial booking…",
    greeting: (name: string) => `Hi ${name}!`,
    greetingNoName: "Confirm your trial class",
    intro: "Please confirm you'll be attending this trial class.",
    introEither:
      "Let us know whether you'll be there. Either answer helps: we'll hold your seat or free it up.",
    introChoose: "Pick the day that suits you, then confirm. Both run the same class.",
    pickHeading: "Choose your day",
    seatsLeft: (n: number) => (n === 1 ? "1 seat left" : `${n} seats left`),
    seatsFull: "Full",
    yourCurrent: "Currently booked",
    language: "Language:",
    date: "Date:",
    time: "Time:",
    tba: "To be announced",
    forTeacher: (t: string) => `That's ${t} for your teacher.`,
    confirmCta: "Confirm my attendance",
    declineCta: "I can't make it",
    confirming: "Confirming your attendance…",
    declining: "Recording your answer…",
    confirmedTitle: "Attendance Confirmed!",
    confirmedNew: "You're all set. See you in class!",
    confirmedAlready: "You've already confirmed your attendance. See you in class!",
    declinedTitle: "Thanks for telling us",
    declinedNew:
      "We've released your seat for this session. You can book another time whenever you're ready.",
    declinedAlready:
      "You told us you can't make this session, so your seat was released. You can book another time whenever you're ready.",
    declinedChanged: "Changed your mind? You can still tell us you're coming.",
    slotFull: "That day filled up while you were deciding. Please pick another, your seat is still safe.",
    slotGone: "That day is no longer available. Please pick another one below.",
    bookAnother: "Book another time",
    accountTitle: "Keep everything in one place",
    accountBody:
      "Create a free account and your class link, materials and reminders all live in your dashboard.",
    accountCta: "Create my account",
    placement: "Take Placement Test",
    pricing: "View Prices",
    joinMeet: "Join via Google Meet",
    errorTitle: "Link Invalid",
    errorBody:
      "This link is invalid or has already been used. Please contact us if you need help.",
    whatsapp: "Contact us on WhatsApp",
    arabic: "Arabic",
    english: "English",
  },
  ar: {
    dir: "rtl" as const,
    lang: "ar",
    locale: "ar-EG",
    tagline: "أكاديمية كلوفرز لتعليم الكورية",
    loading: "جارٍ تحميل بيانات الحصة…",
    greeting: (name: string) => `أهلًا ${name}!`,
    greetingNoName: "تأكيد الحضور للحصة التجريبية",
    intro: "يُرجى تأكيد الحضور للحصة التجريبية عبر الزر أدناه.",
    introEither:
      "يسعدنا معرفة إن كان الحضور ممكنًا. أي ردّ يساعدنا: إما حجز المقعد، وإما إتاحته لشخص آخر.",
    introChoose: "اختيار اليوم المناسب، ثم التأكيد. كل المواعيد للحصة نفسها تمامًا.",
    pickHeading: "اختيار اليوم",
    seatsLeft: (n: number) => (n === 1 ? "بقي مقعد واحد" : `بقي ${n} مقاعد`),
    seatsFull: "مكتملة",
    yourCurrent: "الموعد الحالي",
    language: "لغة الحصة:",
    date: "التاريخ:",
    time: "الساعة:",
    tba: "يُحدَّد قريبًا",
    forTeacher: (t: string) => `أي ${t} بتوقيت المعلمة.`,
    confirmCta: "تأكيد الحضور",
    declineCta: "تعذّر الحضور",
    confirming: "جارٍ تسجيل التأكيد…",
    declining: "جارٍ تسجيل الرد…",
    confirmedTitle: "تم تأكيد الحضور!",
    confirmedNew: "كل شيء جاهز. نلتقي في الحصة!",
    confirmedAlready: "الحضور مؤكَّد بالفعل. نلتقي في الحصة!",
    declinedTitle: "شكرًا على إبلاغنا",
    declinedNew: "أُتيح المقعد في هذه الحصة لشخص آخر. ويمكن حجز موعد آخر في أي وقت.",
    declinedAlready:
      "وصلنا أن الحضور غير ممكن في هذه الحصة، فأُتيح المقعد لشخص آخر. ويمكن حجز موعد آخر في أي وقت.",
    declinedChanged: "تغيّر القرار؟ ما زال تأكيد الحضور ممكنًا.",
    slotFull: "اكتمل هذا اليوم أثناء الاختيار. يُرجى اختيار يوم آخر، فالمقعد ما زال محفوظًا.",
    slotGone: "هذا اليوم لم يعد متاحًا. يُرجى اختيار يوم آخر من القائمة أدناه.",
    bookAnother: "حجز موعد آخر",
    accountTitle: "كل شيء في مكان واحد",
    accountBody:
      "مع حساب مجاني، يجتمع رابط الحصة والمواد والتذكيرات في لوحة واحدة.",
    accountCta: "إنشاء حساب مجاني",
    placement: "اختبار تحديد المستوى",
    pricing: "عرض الأسعار",
    joinMeet: "الدخول عبر Google Meet",
    errorTitle: "الرابط غير صالح",
    errorBody: "هذا الرابط غير صالح أو سبق استخدامه. يسعدنا تقديم المساعدة عند الحاجة.",
    whatsapp: "التواصل عبر واتساب",
    arabic: "العربية",
    english: "الإنجليزية",
  },
};

/** "Asia/Kuala_Lumpur" -> "Kuala Lumpur" */
const tzCity = (tz: string) => (tz.includes("/") ? tz.split("/").pop()!.replace(/_/g, " ") : tz);

const viewerTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

/**
 * A class as this reader should see it: their own date and their own time.
 *
 * This screen used to print `booking.start_time` straight from the database
 * next to the slot's timezone - "14:00 (Africa/Cairo)" - on the one page
 * whose entire purpose is the student saying yes, I'll be there. And it
 * formatted the date with `new Date("2026-09-11")`, which is parsed as UTC
 * midnight and rendered in the browser's zone, so every student west of UTC
 * was shown the previous day.
 *
 * Converting both together is the point: a time without its date moving with
 * it is how someone arrives on the wrong day.
 *
 * Takes loose fields rather than a booking, because the day picker needs the
 * same treatment for every option on offer and not only for the one already
 * on the row.
 */
function renderWhen(
  date: string | null,
  time: string | null,
  timezone: string | null,
  locale: string,
) {
  if (!date || !time) return null;
  const slotTz = timezone || "Africa/Cairo";
  const viewerTz = viewerTimezone() || slotTz;
  const local = convertDateTimeToTimezone(date, time, slotTz, viewerTz);
  if (Number.isNaN(local.hour24)) return null;

  // Local midnight, so toLocaleDateString cannot shift the day back again.
  const [y, m, d] = local.dateStr.split("-").map(Number);
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortLabel = new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sameZone = viewerTz === slotTz;
  const slotLocal = sameZone ? null : convertDateTimeToTimezone(date, time, slotTz, slotTz);

  return {
    dateLabel,
    shortLabel,
    timeLabel: `${local.timeFormatted} (${tzCity(viewerTz)})`,
    alsoLabel: slotLocal ? `${slotLocal.timeFormatted} ${tzCity(slotTz)}` : null,
  };
}

/**
 * Shared button chrome, so the primary action looks the same wherever it
 * appears — and looks like the rest of Klovers.
 *
 * This page was styled in raw Tailwind scale colours that belong to no brand:
 * `#FACC15` (Tailwind yellow-400) for the button, `bg-yellow-50` for the
 * selected day, `text-gray-500` for every secondary line, `bg-green-100` and
 * `bg-red-100` for the outcome badges. Klovers' yellow is `#FFFF00` — the
 * `--primary` token, and `BRAND_YELLOW` in the email templates — so the one
 * screen where a student commits to a class was wearing a slightly-off yellow
 * that appears nowhere else on the site or in the letter that brought her here.
 *
 * Everything now goes through the design tokens in src/index.css, the same way
 * PricingSection, PlacementTestCTA and the enrolment day picker already do:
 * primary / primary-foreground, card, border, muted-foreground, destructive.
 * Fixing the colour once in :root now fixes it here too.
 *
 * The button is yellow on black rather than black on yellow, matching both
 * `bg-primary text-primary-foreground` across the site and `brandButton` in
 * the email — the letter and the page it links to should not disagree.
 */
const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const PRIMARY_CLASS =
  "inline-block bg-primary text-primary-foreground border-2 border-foreground " +
  "font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity " + FOCUS_RING;
const OUTLINE_CLASS =
  "inline-block font-bold px-6 py-3 rounded-xl text-base border border-border " +
  "text-muted-foreground hover:bg-muted transition-colors " + FOCUS_RING;
const QUIET_CLASS = "text-sm text-muted-foreground underline hover:text-foreground rounded-sm " + FOCUS_RING;

/** Ivory info card for the facts a student needs on the day: when, and where. */
const INFO_CARD_CLASS =
  "bg-ivory dark:bg-muted text-charcoal dark:text-foreground border border-foreground/10 " +
  "rounded-2xl p-4 text-start";

const TrialConfirmPage = () => {
  // Transactional page: real content for the signed-in user, nothing a
  // search result should land on. Mirrors the Disallow in robots.txt.
  useSEO({ title: "Trial Confirmation", description: "Confirm your Klovers free trial booking.", noindex: true });

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  // Which answer the email button suggested — nothing more than that.
  //
  // Mail clients and corporate link scanners fetch every URL in a message with
  // no human involved, so arriving here with ?response=no must NOT record a
  // decline: it would cancel the seat of a student who never touched the link.
  // The param only decides which button this page leads with; the write still
  // waits for a real click. Anything other than yes/no is treated as absent.
  const responseParam = searchParams.get("response");
  const suggested: Answer | null =
    responseParam === "yes" || responseParam === "no" ? responseParam : null;

  // Same rule for the day: a `slot` in the link only preselects a radio. The
  // move happens on a click, never on a page load.
  const suggestedSlot = searchParams.get("slot");

  const [state, setState] = useState<PageState>("loading");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [options, setOptions] = useState<SlotOption[]>([]);
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [classLink, setClassLink] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  const fetchClassLink = useCallback(async (trialDate: string | null, startTime: string | null) => {
    if (!trialDate || !startTime) return;
    const { data: slotRow, error } = await supabase
      .from("trial_slots")
      .select("meeting_url")
      .eq("trial_date", trialDate)
      .eq("start_time", startTime)
      .maybeSingle();
    if (error) return;
    const url = (slotRow as { meeting_url?: string | null } | null)?.meeting_url ?? null;
    if (url) setClassLink(url);
  }, []);

  /**
   * The days on offer. Read-only and safe to prefetch, like the booking read
   * beside it. A failure here is not fatal: the page falls back to the single
   * date already on the booking, which is what it showed before choosing was
   * possible at all.
   */
  const loadOptions = useCallback(async (currentSlotPreference?: string | null) => {
    const { data, error } = await (supabase.rpc as any)("get_trial_slot_options", {
      p_token: token,
    });
    if (error || !Array.isArray(data)) return [] as SlotOption[];
    const rows = data as SlotOption[];
    setOptions(rows);
    setChosenSlot(prev => {
      const wanted = currentSlotPreference ?? prev;
      if (wanted && rows.some(r => r.slot_id === wanted)) return wanted;
      const current = rows.find(r => r.is_current);
      return current?.slot_id ?? rows[0]?.slot_id ?? null;
    });
    return rows;
  }, [token]);

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    const load = async () => {
      // Read-only, STABLE, no write — safe for a mail client or link
      // scanner to prefetch. The write only happens on a real button
      // click, below.
      const { data, error } = await (supabase.rpc as any)(
        "get_trial_booking_by_token",
        { p_token: token },
      ).maybeSingle();

      if (error || !data) {
        setState("error");
        return;
      }

      setBooking(data);
      // Both answers are already-answered: someone who declined and clicks the
      // link again should be told what they said, not shown a fresh choice as
      // if we never heard from them.
      const existing: Answer | null =
        data.attendance_response === "yes" || data.attendance_response === "no"
          ? data.attendance_response
          : null;
      setAnswer(existing);
      setState(existing ? "already" : "ready");
      fetchClassLink(data.trial_date, data.start_time);
      loadOptions(suggestedSlot);
    };

    load();
  }, [token, suggestedSlot, fetchClassLink, loadOptions]);

  // Whether to offer an account after confirming. The booking row cannot
  // answer this - get_trial_booking_by_token deliberately returns no user_id -
  // so the question asked is the one that matters for what to show: is the
  // person reading this page signed in right now. Null until known, so the
  // offer never flashes in and out.
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setHasAccount(Boolean(data.session));
      })
      .catch(() => {
        // Treat an unreadable session as signed in: showing nothing is a
        // smaller mistake than telling an existing student to sign up again.
        if (alive) setHasAccount(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleRespond = async (response: Answer) => {
    setNotice(null);
    setAnswer(response);
    setState("responding");

    // Always the three-argument form, so a decline and a confirm take the same
    // path through the database. The slot is ignored on a decline.
    const { data, error } = await (supabase.rpc as any)(
      "respond_trial_attendance",
      { p_token: token, p_response: response, p_slot_id: response === "yes" ? chosenSlot : null },
    ).maybeSingle();

    if (error) {
      // A session that filled up between loading this page and pressing the
      // button is not a broken link, and must not be shown as one: her booking
      // is untouched and the only thing she needs to do is pick another day.
      const msg = String(error.message ?? "");
      if (msg.includes("trial_slot_full") || msg.includes("trial_slot_unavailable")) {
        await loadOptions(null);
        setNotice(msg.includes("trial_slot_full") ? t.slotFull : t.slotGone);
        setAnswer(null);
        setState("ready");
        return;
      }
      setState("error");
      return;
    }

    if (!data) {
      setState("error");
      return;
    }

    setBooking(data);
    fetchClassLink(data.trial_date, data.start_time);
    setState("success");
  };

  const t = booking?.class_language === "arabic" ? COPY.ar : COPY.en;
  const when = booking && !booking.is_tba
    ? renderWhen(booking.trial_date, booking.start_time, booking.timezone, t.locale)
    : null;
  const languageLabel =
    booking?.class_language === "arabic"
      ? t.arabic
      : booking?.class_language === "english"
        ? t.english
        : "—";

  // The picker earns its space only when there is a real choice. One option is
  // not a choice, and showing a single locked radio would suggest otherwise.
  const canChoose = options.length > 1 && !booking?.is_tba;

  // The charcoal backdrop is the brand: the wordmark is yellow on dark wherever
  // it appears. The card on top of it uses the card token, so it follows the
  // theme like every other panel.
  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <div
        dir={t.dir}
        lang={t.lang}
        className="bg-card text-card-foreground rounded-3xl shadow-xl max-w-md w-full p-8 text-center"
      >
        {/* Logo / brand */}
        <div className="mb-6">
          <span dir="ltr" className="inline-block rounded-2xl bg-charcoal px-4 py-1.5 text-4xl font-black tracking-tight text-ivory">
            K<span className="text-klovers-yellow">lovers</span>
          </span>
          <p className="text-muted-foreground text-sm mt-2">{t.tagline}</p>
        </div>

        {state === "loading" && (
          <div className="py-8">
            <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        )}

        {state === "ready" && booking && (
          <div className="py-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {booking.first_name ? t.greeting(booking.first_name) : t.greetingNoName}
            </h1>
            <p className="text-muted-foreground mb-5">
              {canChoose ? t.introChoose : suggested === "yes" ? t.intro : t.introEither}
            </p>

            {notice && (
              <div className="bg-charcoal text-ivory border-s-4 border-klovers-yellow rounded-xl p-3 mb-5 text-sm text-start">
                {notice}
              </div>
            )}

            {canChoose ? (
              <div className={`mb-6 ${t.dir === "rtl" ? "text-right" : "text-left"}`}>
                <p className="text-xs font-bold tracking-wide text-muted-foreground mb-2">
                  {t.pickHeading}
                </p>
                <div className="space-y-2">
                  {options.map(o => {
                    const w = renderWhen(o.trial_date, o.start_time, o.timezone, t.locale);
                    const seats = o.seats_left ?? 0;
                    const full = seats <= 0 && !o.is_current;
                    const selected = chosenSlot === o.slot_id;
                    return (
                      <button
                        key={o.slot_id}
                        type="button"
                        disabled={full}
                        onClick={() => setChosenSlot(o.slot_id)}
                        aria-pressed={selected}
                        className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background w-full rounded-xl border p-3 transition-colors ${
                          t.dir === "rtl" ? "text-right" : "text-left"
                        } ${
                          selected
                            ? "border-2 border-foreground bg-ivory dark:bg-muted"
                            : full
                              ? "border-border opacity-50 cursor-not-allowed"
                              : "border-border hover:border-foreground/50"
                        }`}
                      >
                        <span className="block text-sm font-bold text-foreground">
                          {w ? w.shortLabel : o.trial_date ?? t.tba}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {w ? w.timeLabel : o.start_time ?? ""}
                        </span>
                        <span className="block text-xs text-muted-foreground/70 mt-0.5">
                          {full ? t.seatsFull : t.seatsLeft(seats)}
                          {o.is_current ? ` · ${t.yourCurrent}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className={`${INFO_CARD_CLASS} mb-6 text-sm space-y-1.5 ${
                  t.dir === "rtl" ? "text-right" : "text-left"
                }`}
              >
                <p><span className="font-semibold">{t.language}</span> {languageLabel}</p>
                <p>
                  <span className="font-semibold">{t.date}</span>{" "}
                  {booking.is_tba ? t.tba : when ? when.dateLabel : "—"}
                </p>
                {when && (
                  <p>
                    <span className="font-semibold">{t.time}</span> {when.timeLabel}
                    {when.alsoLabel && (
                      <span className="block text-xs opacity-70 mt-0.5">
                        {t.forTeacher(when.alsoLabel)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* With a day picker on screen, confirm is always the loud button:
                the reader has just made a choice and the next move is to
                commit to it. Without one, the email's button decides which
                answer leads; the other is always one click away, never hidden.
                With no param — someone who typed the link or forwarded it —
                neither answer is assumed. */}
            {!canChoose && suggested === "no" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleRespond("no")}

                  className={PRIMARY_CLASS}
                >
                  {t.declineCta}
                </button>
                <div className="mt-4">
                  <button type="button" onClick={() => handleRespond("yes")} className={QUIET_CLASS}>
                    {t.confirmCta}
                  </button>
                </div>
              </>
            ) : !canChoose && suggested === "yes" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleRespond("yes")}

                  className={PRIMARY_CLASS}
                >
                  {t.confirmCta}
                </button>
                <div className="mt-4">
                  <button type="button" onClick={() => handleRespond("no")} className={QUIET_CLASS}>
                    {t.declineCta}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleRespond("yes")}
                  disabled={canChoose && !chosenSlot}

                  className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${PRIMARY_CLASS} disabled:opacity-40`}
                >
                  {t.confirmCta}
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond("no")}
                  className={OUTLINE_CLASS}
                >
                  {t.declineCta}
                </button>
              </div>
            )}
          </div>
        )}

        {state === "responding" && (
          <div className="py-8">
            <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{answer === "no" ? t.declining : t.confirming}</p>
          </div>
        )}

        {(state === "success" || state === "already") && answer !== "no" && (
          <div className="py-4">
            {/* Celebration: the two friends and Cluby at the Han river picnic. */}
            <div className="relative -mx-2 mb-6">
              <img
                src="/assets/cluby/picnic.webp"
                width={1600}
                height={900}
                alt={
                  t.lang === "ar"
                    ? "صديقان وكلوبي يحتفلون في نزهة على ضفاف نهر الهان"
                    : "Two friends and Cluby celebrating at a Han river picnic"
                }
                className="w-full aspect-video object-cover rounded-2xl border border-border shadow-md"
                loading="eager"
                decoding="async"
              />
              <span className="absolute -bottom-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-klovers-green border-2 border-charcoal shadow-md">
                <CheckCircle2 className="h-5 w-5 text-charcoal" />
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t.confirmedTitle}</h1>
            <p className="text-muted-foreground mb-4">
              {state === "already" ? t.confirmedAlready : t.confirmedNew}
            </p>
            {when && (
              <div className={`${INFO_CARD_CLASS} mb-3 space-y-2`}>
                <p className="flex items-center gap-2 text-sm font-bold">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  {when.dateLabel}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 shrink-0" />
                  {when.timeLabel}
                </p>
              </div>
            )}
            {classLink && (
              <a
                href={classLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-charcoal text-klovers-yellow font-bold text-sm px-4 py-3 hover:opacity-90 transition-opacity"
              >
                <Video className="h-4 w-4 shrink-0" />
                {t.joinMeet}
              </a>
            )}
            <div className="mb-3" />

            {/* Offered only to a reader with no session, and only after they
                have said they are coming. Before that it is one more thing
                between them and the seat. */}
            {hasAccount === false && (
              <div className="bg-muted/50 border border-border rounded-2xl p-4 mb-6">
                <p className="font-semibold text-foreground text-sm mb-1">{t.accountTitle}</p>
                <p className="text-muted-foreground text-sm mb-3">{t.accountBody}</p>
                <a
                  href="/signup"
                  className="inline-block bg-primary text-primary-foreground border-2 border-foreground font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-80 transition-opacity"
                >
                  {t.accountCta}
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/placement-test"
                className={PRIMARY_CLASS}
              >
                {/* needs Klovers icon */}
                <ClipboardList className="inline h-4 w-4 me-1.5 -mt-0.5" aria-hidden="true" />
                {t.placement}
              </a>
              <a
                href="/pricing"
                className={PRIMARY_CLASS}
              >
                {/* needs Klovers icon */}
                <Tag className="inline h-4 w-4 me-1.5 -mt-0.5" aria-hidden="true" />
                {t.pricing}
              </a>
            </div>
          </div>
        )}

        {/* A decline is not a failure and must not look like one. The seat is
            gone, so say that plainly and point at the one thing worth doing
            next — /free-trial, the public picker, because /trial-booking sits
            behind AuthProtectedRoute and would ask her to sign up first. */}
        {(state === "success" || state === "already") && answer === "no" && (
          <div className="py-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t.declinedTitle}</h1>
            <p className="text-muted-foreground mb-6">
              {state === "already" ? t.declinedAlready : t.declinedNew}
            </p>
            <a href="/free-trial" className={PRIMARY_CLASS}>
              {t.bookAnother}
            </a>
            <p className="text-sm text-muted-foreground mt-6 mb-2">{t.declinedChanged}</p>
            <button type="button" onClick={() => handleRespond("yes")} className={QUIET_CLASS}>
              {t.confirmCta}
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="py-4">
            <div className="w-16 h-16 bg-wrong-graphic/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-wrong-graphic" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t.errorTitle}</h1>
            <p className="text-muted-foreground mb-6">{t.errorBody}</p>
            <a
              href="https://wa.me/201010003084"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-primary-foreground border-2 border-foreground font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              {t.whatsapp}
            </a>
          </div>
        )}

        <p className="text-muted-foreground/70 text-xs mt-8">
          <a href="https://kloversegy.com" className="hover:underline">kloversegy.com</a>
        </p>
      </div>
    </div>
  );
};

export default TrialConfirmPage;

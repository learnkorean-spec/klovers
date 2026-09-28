import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import TrialSlotPicker from "@/components/TrialSlotPicker";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { LEVEL_SELECT_OPTIONS, getLevelShortLabel } from "@/constants/levels";
import { ACTIVE_TRIAL_STATUS_LIST } from "@/constants/trialStatus";
import { CheckCircle2, CalendarPlus, CalendarClock, CalendarX, ArrowRight, LayoutDashboard, MessageCircle, Share2, Link2, Check } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { countryLabel } from "@/lib/countryNames";
import { useLanguage } from "@/contexts/LanguageContext";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { buildCountryLocalPrices, getTierForCountry, tierPrices } from "@/lib/stripePrices";
import { toArabicDigits } from "@/lib/trustFigures";

// ── Country / pricing helpers ─────────────────────────────────────────────────

/** IANA timezone → country name (best-effort pre-fill) */
const TZ_TO_COUNTRY: Record<string, string> = {
  "Africa/Cairo": "Egypt", "Africa/Casablanca": "Morocco", "Africa/Tunis": "Tunisia",
  "Africa/Algiers": "Algeria", "Africa/Tripoli": "Libya", "Asia/Amman": "Jordan",
  "Asia/Beirut": "Lebanon", "Asia/Baghdad": "Iraq", "Asia/Damascus": "Syria",
  "Africa/Khartoum": "Sudan", "Asia/Aden": "Yemen",
  "Asia/Dubai": "UAE", "Asia/Riyadh": "Saudi Arabia", "Asia/Qatar": "Qatar",
  "Asia/Bahrain": "Bahrain", "Asia/Muscat": "Oman", "Asia/Kuwait": "Kuwait",
  "Asia/Kuala_Lumpur": "Malaysia", "Asia/Singapore": "Malaysia",
  "Asia/Jakarta": "Indonesia", "Asia/Bangkok": "Thailand",
  "Asia/Ho_Chi_Minh": "Vietnam", "Asia/Manila": "Philippines",
  "Asia/Kolkata": "India", "Asia/Karachi": "Pakistan",
  "America/Sao_Paulo": "Brazil", "America/Mexico_City": "Mexico",
  "America/Bogota": "Colombia", "America/Argentina/Buenos_Aires": "Argentina",
  "Europe/Istanbul": "Turkey",
  "America/New_York": "United States", "America/Los_Angeles": "United States",
  "America/Chicago": "United States", "America/Toronto": "Canada",
  "Europe/London": "United Kingdom", "Europe/Berlin": "Germany",
  "Europe/Paris": "France", "Australia/Sydney": "Australia",
  "Asia/Tokyo": "Japan", "Asia/Seoul": "South Korea", "Asia/Shanghai": "China",
};

/**
 * Starting group price per country, read from the same table the pricing page
 * uses (@/lib/stripePrices): the country's own 1-month group price in its local
 * currency where one exists, otherwise its tier's USD price — exactly what
 * PricingSection shows for that country. The old hardcoded copy here showed
 * Malaysia "$40/mo" while the pricing page showed 175 MYR.
 */
const countryLocalPrices = buildCountryLocalPrices();

/** Arabic currency names, so the Arabic line stays in one script. */
const CURRENCY_AR: Record<string, string> = {
  EGP: "جنيه", USD: "دولار", MAD: "درهم مغربي", TND: "دينار تونسي", DZD: "دينار جزائري",
  LYD: "دينار ليبي", JOD: "دينار أردني", IQD: "دينار عراقي", MYR: "رينجت", IDR: "روبية إندونيسية",
  THB: "بات تايلاندي", VND: "دونغ فيتنامي", PHP: "بيزو فلبيني", INR: "روبية هندية", PKR: "روبية باكستانية",
  BRL: "ريال برازيلي", MXN: "بيزو مكسيكي", COP: "بيزو كولومبي", TRY: "ليرة تركية", AED: "درهم إماراتي",
  SAR: "ريال سعودي", QAR: "ريال قطري", BHD: "دينار بحريني", OMR: "ريال عُماني", KWD: "دينار كويتي",
  GBP: "جنيه إسترليني", EUR: "يورو", CAD: "دولار كندي", AUD: "دولار أسترالي", JPY: "ين ياباني",
  KRW: "وون كوري", CNY: "يوان صيني",
};

/** 1200 -> "١٬٢٠٠": Arabic-Indic digits with Arabic separators. */
const arNumber = (n: number): string =>
  toArabicDigits(n.toLocaleString("en-US")).replace(/,/g, "٬").replace(/\./g, "٫");

/** Arabic city names for common timezones; anything else reads «بالتوقيت المحلي». */
const TZ_CITY_AR: Record<string, string> = {
  "Africa/Cairo": "القاهرة", "Asia/Riyadh": "الرياض", "Asia/Dubai": "دبي",
  "Asia/Kuala_Lumpur": "كوالالمبور", "Asia/Bangkok": "بانكوك",
  "Asia/Ho_Chi_Minh": "هو تشي منه", "Europe/London": "لندن",
};

/**
 * What the student reads when book-trial refuses a booking. The function
 * answers in English (and a 500 carries a raw database message), so the
 * Arabic page used to show «You already have a trial class booked…» as is.
 * Arabic gets one plain, gender-neutral MSA sentence per known case; English
 * keeps the server's friendly sentence, except for unexpected 500s.
 */
function bookingErrorText(
  body: { error?: string; error_code?: string; book_again_from?: string } | null | undefined,
  status: number | undefined,
  isAr: boolean,
  fallback: string,
): string {
  const msg = body?.error ?? "";
  if (!isAr) return !msg || (status ?? 0) >= 500 ? fallback : msg;
  if (body?.error_code === "slot_taken")
    return "حُجز هذا الموعد قبل لحظات. يُرجى اختيار موعد آخر.";
  if (body?.error_code === "rejoin_cooldown")
    return body.book_again_from
      ? `أُلغيت حصة تجريبية بهذا البريد مؤخرًا، ويمكن الحجز مرة أخرى ابتداءً من ${toArabicDigits(body.book_again_from)}. للحضور قبل ذلك يُرجى مراسلتنا على واتساب.`
      : "أُلغيت حصة تجريبية بهذا البريد مؤخرًا، ويمكن الحجز مرة أخرى بعد شهر من تاريخ الإلغاء. للحضور قبل ذلك يُرجى مراسلتنا على واتساب.";
  if (/already have a trial/i.test(msg))
    return "توجد حصة تجريبية محجوزة بهذا البريد، وتفاصيلها في البريد الإلكتروني.";
  if (/booking is closed/i.test(msg))
    return "أُغلق الحجز لهذا الموعد، فالتسجيل يُغلق قبل الحصة بيوم. يُرجى اختيار موعد آخر.";
  if (/overlaps/i.test(msg))
    return "هذا الموعد يتعارض مع حصة مسجَّلة في الحساب. يُرجى اختيار موعد آخر أو مراسلتنا على واتساب.";
  if (/invalid email/i.test(msg))
    return "البريد الإلكتروني غير صحيح. يُرجى التأكد منه.";
  return fallback;
}

function tzLabelAr(tz: string): string {
  const city = TZ_CITY_AR[tz];
  return city ? `بتوقيت ${city}` : "بالتوقيت المحلي";
}

const ALL_COUNTRIES = [
  "Algeria","Argentina","Australia","Bahrain","Brazil","Canada","China",
  "Colombia","Egypt","France","Germany","India","Indonesia","Iraq","Japan",
  "Jordan","Kuwait","Lebanon","Libya","Malaysia","Mexico","Morocco","Oman",
  "Pakistan","Philippines","Qatar","Saudi Arabia","South Korea","Sudan",
  "Syria","Thailand","Tunisia","Turkey","UAE","United Kingdom","United States",
  "Vietnam","Yemen",
];

function getStartingPrice(country: string, isAr: boolean): string {
  const local = countryLocalPrices[country]?.group[0];
  if (local) {
    return isAr
      ? `${arNumber(local.local)} ${CURRENCY_AR[local.currency] ?? local.currency} شهريًا`
      : `${local.local.toLocaleString("en-US")} ${local.currency}/mo`;
  }
  const usd = tierPrices[getTierForCountry(country) ?? "local"].group[1];
  return isAr ? `${arNumber(usd)} دولار شهريًا` : `$${usd}/mo`;
}

function guessCountryFromTz(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_COUNTRY[tz] ?? "Egypt";
  } catch { return "Egypt"; }
}

/** Countries whose trial classes are taught in Arabic */
const ARABIC_COUNTRIES = new Set([
  "Egypt","Morocco","Tunisia","Algeria","Libya","Jordan","Lebanon",
  "Iraq","Syria","Sudan","Yemen","UAE","Saudi Arabia","Qatar",
  "Bahrain","Oman","Kuwait",
]);

/** Auto-detect class language from country */
function defaultLanguageForCountry(country: string): "arabic" | "english" {
  return ARABIC_COUNTRIES.has(country) ? "arabic" : "english";
}

const isMissingAuditColumn = (error: any) =>
  error?.code === "42703" || /changed_at|cancelled_at|cancel_reason/i.test(error?.message || "");

// ───────────────────────────────────────────────────────────────────────────

interface BookingResult {
  trial_date: string;
  day_name: string;
  start_time: string;
  start_time_12h: string;
  duration_min: number;
  timezone: string;
  calendar_url: string;
}

/** A trial_bookings row, in the shape either recovery path can select. */
interface BookingRow {
  trial_date?: string | null;
  start_time?: string | null;
  duration_min?: number | null;
  timezone?: string | null;
  calendar_url?: string | null;
}

/**
 * Turn a booking row into the object the success screen renders.
 *
 * Both recovery paths — the "you already have a booking" pre-check and the
 * 429 double-tap check — used to build this by hand, and the 429 one built it
 * from a five-column select that had none of the fields the screen needs. It
 * then cast the result with `as any`, so nothing complained: the student saw
 * a blank duration and a time computed against a fallback timezone hours away
 * from the real one. One mapper, so a missing column is a compile error rather
 * than a wrong time in front of a student.
 *
 * The fallbacks match the actual trial_bookings column defaults (30 minutes,
 * Africa/Cairo). They were 45 and Asia/Kuala_Lumpur, which matched nothing.
 */
function toBookingResult(row: BookingRow | null | undefined): BookingResult | null {
  if (!row?.trial_date) return null;
  const time = row.start_time ?? "";
  const hhmm = time.match(/^(\d{1,2}):(\d{2})$/);
  const start_time_12h = hhmm
    ? (() => {
        const h = Number(hhmm[1]);
        const m = Number(hhmm[2]);
        const ap = h >= 12 ? "PM" : "AM";
        return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
      })()
    : "";
  return {
    trial_date: row.trial_date,
    day_name: new Date(row.trial_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" }),
    start_time: time,
    start_time_12h,
    duration_min: row.duration_min ?? 30,
    timezone: row.timezone || "Africa/Cairo",
    calendar_url: row.calendar_url || "",
  };
}

/** Today's date in the reader's own zone, as YYYY-MM-DD. */
function localToday(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const TrialBookingPage = () => {
  const { t, language } = useLanguage();
  // Transactional page behind auth: a real page for the signed-in user, but
  // nothing a search result should land on. Mirrors the Disallow in robots.txt.
  // The canonical is dropped with it - a noindex page should not nominate
  // itself as the preferred version of anything.
  useSEO({
    title: document.documentElement.lang === "ar" ? "اختيار موعد الحصة المجانية" : "Pick Your Free Trial Slot",
    description: document.documentElement.lang === "ar" ? "تأكيد الحصة الكورية التجريبية المجانية باختيار اليوم والوقت المناسبين." : "Confirm your free Korean trial class. Pick a day and time that works for you.",
    noindex: true,
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null; email: string | null; level: string | null; country: string | null; phone: string | null } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(guessCountryFromTz);
  // WhatsApp number. Required for a trial booking, and for one reason: on
  // 18 September two students booked into Friday's class could not be reached
  // at all, because their address bounced four times and nothing else about
  // them was stored. Email is the only channel this system has, and it fails
  // silently. Optional everywhere else - it is asked for here because here it
  // is about a class that starts in days, not a newsletter.
  const [phone, setPhone] = useState("");
  // Guests book without an account (audit 23 Sep 2026: the password wall in
  // front of the slot picker was the biggest leak in the funnel). book-trial
  // has always accepted an unauthenticated booking with a name and an email,
  // and the confirmation link in the email works without signing in.
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const guestEmailIsValid = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(guestEmail.trim());
  const [classLanguage, setClassLanguage] = useState<"arabic" | "english">(() =>
    defaultLanguageForCountry(guessCountryFromTz())
  );

  // Keep class language in sync when user changes country
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setClassLanguage(defaultLanguageForCountry(country));
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, level, country, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as any);
        const profileLevel = (data as any)?.level?.trim();
        const metaLevel = (user.user_metadata?.level as string | undefined)?.trim();
        if (profileLevel) {
          setSelectedLevel(profileLevel);
        } else if (metaLevel) {
          setSelectedLevel(metaLevel);
        }
        // Pre-fill the number we already hold, so a returning student is not
        // asked twice.
        const profilePhone = (data as any)?.phone?.trim();
        if (profilePhone) setPhone(profilePhone);
        // Pre-fill country from profile if available — avoids asking the user again
        const profileCountry = (data as any)?.country?.trim();
        if (profileCountry && ALL_COUNTRIES.includes(profileCountry)) {
          setSelectedCountry(profileCountry);
          setClassLanguage(defaultLanguageForCountry(profileCountry));
        }
        setProfileLoaded(true);
      });
  }, [user]);

  // Pre-check for an existing active trial booking so users aren't thrown
  // into the error "You already have a trial class booked" from the edge
  // function — instead, show them their existing booking as the success
  // screen. Fixes the UX cliff hitting ~4 sessions/month of users who
  // bounce back to /trial-booking a second time.
  //
  // This could not fire at all before: it filtered on ["pending","confirmed"]
  // while book-trial creates every authenticated booking as
  // "awaiting_attendance". The one flow it was written for was the one flow
  // it never matched, so the returning student was shown the picker again,
  // rebooked, and had her original row cancelled as a "student_reschedule"
  // she never asked for.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("trial_bookings")
        .select("trial_date, start_time, duration_min, timezone, calendar_url, status")
        .eq("user_id", user.id)
        .in("status", ACTIVE_TRIAL_STATUS_LIST)
        .gte("trial_date", localToday())
        .neq("trial_date", "2099-12-31")
        .order("trial_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      const existing = toBookingResult(data as BookingRow | null);
      if (existing) setBookingResult(existing);
    })();
  }, [user]);

  // Loose on purpose: country codes, spaces, dashes and a leading + all pass,
  // and the only thing rejected is something that cannot be a number at all.
  // A stricter rule would reject real numbers from countries nobody here
  // anticipated, and an empty field is what this is actually guarding against.
  const phoneDigits = phone.replace(/[^0-9]/g, "");
  const phoneIsValid = phoneDigits.length >= 8 && phoneDigits.length <= 15;

  // True when neither profile nor user_metadata has a level — we need to ask.
  // A guest has no profile, so the level is always asked.
  const needsLevel = !user || (
    profileLoaded &&
    !(profile?.level?.trim()) &&
    !((user?.user_metadata?.level as string | undefined)?.trim()));

  const handleSlotPicked = async (dayOfWeek: number, startTime: string, trialDate: string) => {
    if (!user && (!guestName.trim() || !guestEmailIsValid)) {
      toast({
        title: language === "ar" ? "يُرجى كتابة الاسم والبريد" : "Add your name and email",
        description: language === "ar"
          ? "يُرسَل رابط الحصة وتفاصيلها إلى البريد الإلكتروني."
          : "We send the class link and details to your email.",
        variant: "destructive",
      });
      return;
    }

    // If we still don't have a level (profile empty + dropdown untouched), ask for it.
    if (needsLevel && !selectedLevel) {
      toast({
        title: t("trialBooking.pickLevelTitle"),
        description: t("trialBooking.pickLevelDesc"),
        variant: "destructive",
      });
      return;
    }

    // No number, no booking. See the comment on the `phone` state above.
    if (!phoneIsValid) {
      toast({
        title: language === "ar" ? "رقم الواتساب مطلوب" : "WhatsApp number required",
        description: language === "ar"
          ? "يُستخدم الرقم لإرسال رابط الحصة إن لم يصل البريد."
          : "We need your number so we can send you the class link if email fails.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let skipFinallyReset = false;
    try {
      // Log the intent (links automatically to user via session_id stitching)
      logLeadEvent({
        source_type: "free_trial",
        cta_label: "trial_booking_confirm",
        metadata: { day_of_week: dayOfWeek, start_time: startTime },
      });

      const referrerId = (() => {
        try { return localStorage.getItem("referrer_id") || undefined; } catch { return undefined; }
      })();

      const effectiveLevel =
        profile?.level?.trim() ||
        (user?.user_metadata?.level as string | undefined)?.trim() ||
        selectedLevel ||
        "";

      // If the user picked a level here (and profile was empty), persist it so
      // we don't ask again on future flows.
      if (user && needsLevel && selectedLevel) {
        await supabase
          .from("profiles")
          .update({ level: selectedLevel })
          .eq("user_id", user.id);
      }

      // Keep the number on the profile too, so the next booking does not ask
      // again and the admin screens can reach this student without opening the
      // booking row.
      const trimmedPhone = phone.trim();
      if (user && trimmedPhone && trimmedPhone !== (profile?.phone ?? "").trim()) {
        await supabase
          .from("profiles")
          .update({ phone: trimmedPhone })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase.functions.invoke("book-trial", {
        body: {
          // Authenticated path: server pulls name/email/user_id from JWT.
          // We still pass the values from the client profile as a fallback
          // for the first few sessions until book-trial is fully migrated.
          name: user ? (profile?.name || user.email?.split("@")[0] || "Student") : guestName.trim(),
          email: user ? user.email : guestEmail.trim().toLowerCase(),
          phone: phone.trim(),
          level: effectiveLevel || undefined,
          day_of_week: dayOfWeek,
          start_time: startTime,
          trial_date: trialDate,           // always concrete — slot picker guarantees this
          class_language: classLanguage,
          country: selectedCountry,
          referrer_id: referrerId,
          authed: !!user,
          // The student's real zone, straight from the browser — never
          // inferred from country or phone. Read the same way the rest of
          // this page reads it, bypassing any stale localStorage value.
          student_timezone: (() => {
            try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
          })(),
        },
      });

      if (error) throw error;
      if (data?.error) {
        logLeadEvent({ source_type: "free_trial", cta_label: "booking_failed", metadata: { reason: data.error } });
        toast({ title: t("trialBooking.bookingFailed"), description: bookingErrorText(data, undefined, language === "ar", t("trialBooking.tryAgain")), variant: "destructive" });
        setLoading(false);
        return;
      }

      setBookingResult(data.booking);
    } catch (err: any) {
      // supabase-js treats any non-2xx as FunctionsHttpError: the status is
      // on err.context (the raw Response) and book-trial's JSON body is not
      // read yet. Read it once, up front. The 429 check used to also match
      // the generic "non-2xx" message, so every refusal (409 slot taken,
      // already booked, booking closed…) was shown as "too many attempts".
      const status: number | undefined = err?.context?.status;
      let body: { error?: string; error_code?: string; book_again_from?: string } | null = null;
      if (err?.context && typeof err.context.json === "function") {
        try {
          body = await err.context.json();
        } catch {
          // Body wasn't JSON or already consumed.
        }
      }
      const is429 = status === 429 || (!body && typeof err?.message === "string" && err.message.includes("non-2xx"));
      const alreadyBooked = typeof body?.error === "string" && /already have a trial/i.test(body.error);

      if (is429 || alreadyBooked) {
        // Before showing an error, check whether the booking actually landed
        // (the function may have succeeded on a prior tap before rate-limiting
        // kicked in). Select everything the success screen needs — this used
        // to fetch five columns and cast them through `as any`, which is how a
        // student who double-tapped ended up looking at a blank duration and a
        // time converted from the wrong timezone.
        const { data: existing } = await supabase
          .from("trial_bookings")
          .select("id, trial_date, start_time, day_of_week, status, duration_min, timezone, calendar_url")
          .eq("email", user?.email ?? guestEmail.trim().toLowerCase())
          .neq("status", "cancelled")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.trial_date === trialDate && existing?.start_time === startTime) {
          // Booking succeeded on a previous tap — treat as success silently.
          const recovered = toBookingResult(existing as BookingRow);
          if (recovered) {
            setBookingResult(recovered);
            return;
          }
        }

        if (is429) {
          toast({
            title: t("trialBooking.tooManyAttempts") ?? "Too many attempts",
            description: t("trialBooking.tooManyAttemptsDesc") ?? "Please wait a moment, then check your dashboard — your booking may already be saved.",
            variant: "destructive",
          });
          // Keep button disabled for 8 s so the student doesn't hammer again.
          skipFinallyReset = true;
          setTimeout(() => setLoading(false), 8000);
          return;
        }
      }

      if (body?.error) {
        logLeadEvent({ source_type: "free_trial", cta_label: "booking_failed", metadata: { reason: body.error } });
        toast({
          title: t("trialBooking.bookingFailed"),
          description: bookingErrorText(body, status, language === "ar", t("trialBooking.tryAgain")),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      logLeadEvent({ source_type: "free_trial", cta_label: "booking_failed", metadata: { reason: err?.message || "unknown" } });
      toast({
        title: t("trialBooking.somethingWrong"),
        description: language === "ar" ? t("trialBooking.tryAgain") : (err.message || t("trialBooking.tryAgain")),
        variant: "destructive",
      });
    } finally {
      if (!skipFinallyReset) setLoading(false);
    }
  };

  // Referral share link for invite-a-friend CTA on success screen
  const [referralCopied, setReferralCopied] = useState(false);
  const referralShareUrl = user
    ? `https://kloversegy.com/free-trial?ref=${user.id}`
    : "https://kloversegy.com/free-trial";

  // Fire once when success state renders: funnel + Meta Pixel + GA4
  useEffect(() => {
    if (bookingResult) {
      track.custom("post_trial_screen_shown", { trial_date: bookingResult.trial_date });
      // Meta Pixel Lead event with LTV signal for paid ads optimisation
      track.lead({ content_name: "trial_booked", trial_date: bookingResult.trial_date, value: 3, currency: "USD" });
      // Log funnel event for acquisition attribution
      logLeadEvent({
        source_type: "free_trial",
        cta_label: "trial_booked_confirmed",
        metadata: { trial_date: bookingResult.trial_date, day_name: bookingResult.day_name },
      });
    }
  }, [bookingResult]);

  // Funnel step: slot picker page viewed. With landing_viewed +
  // trial_booking_confirm already in place, this closes the funnel:
  // landing → cta → slot_page → confirm.
  useEffect(() => {
    logLeadEvent({ source_type: "free_trial", cta_label: "slot_page_viewed" });
  }, []);

  // ── Reschedule: re-show slot picker without pre-cancelling. When the
  // student completes the new booking, book-trial closes the old row with
  // changed/cancel timestamps so admin keeps a visible audit trail.
  const handleReschedule = () => {
    if (!user || !bookingResult) return;
    track.custom("trial_reschedule_started", { old_date: bookingResult.trial_date });
    logLeadEvent({
      source_type: "free_trial",
      cta_label: "trial_reschedule_started",
      metadata: { old_date: bookingResult.trial_date },
    });
    setBookingResult(null);
  };

  const handleCancelBooking = async () => {
    if (!user || !bookingResult) return;
    setCancelling(true);
    try {
      const now = new Date().toISOString();
      // .select("id") so we can see WHICH rows were cancelled. PostgREST
      // reports a zero-row UPDATE as a success, and the status filter here
      // used to be ["pending","confirmed"] while every authenticated booking
      // is created as "awaiting_attendance" — so this matched nothing, said
      // nothing, and the student was told her class was cancelled while it
      // stayed on the roster and kept holding a seat.
      const update = await supabase
        .from("trial_bookings")
        .update({
          status: "cancelled",
          cancelled_at: now,
          cancel_reason: "student_cancel",
        } as any)
        .eq("user_id", user.id)
        .eq("trial_date", bookingResult.trial_date)
        .in("status", ACTIVE_TRIAL_STATUS_LIST)
        .select("id");

      let cancelledRows = update.data?.length ?? 0;
      if (update.error) {
        if (!isMissingAuditColumn(update.error)) throw update.error;
        const fallback = await supabase
          .from("trial_bookings")
          .update({ status: "cancelled" })
          .eq("user_id", user.id)
          .eq("trial_date", bookingResult.trial_date)
          .in("status", ACTIVE_TRIAL_STATUS_LIST)
          .select("id");
        if (fallback.error) throw fallback.error;
        cancelledRows = fallback.data?.length ?? 0;
      }

      if (cancelledRows === 0) {
        // Nothing matched. Never claim a cancellation that did not happen —
        // the student would walk away believing the seat was released.
        toast({
          title: t("trialBooking.somethingWrong"),
          description: t("trialBooking.tryAgain"),
          variant: "destructive",
        });
        return;
      }

      track.custom("trial_cancelled", { old_date: bookingResult.trial_date });
      logLeadEvent({
        source_type: "free_trial",
        cta_label: "trial_cancelled",
        metadata: { old_date: bookingResult.trial_date },
      });

      toast({
        title: t("trialBooking.cancelToast"),
        variant: "default",
      });
      setBookingResult(null);
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: t("trialBooking.somethingWrong"),
        description: language === "ar" ? t("trialBooking.tryAgain") : (err.message || t("trialBooking.tryAgain")),
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────────────────────────────
  if (bookingResult) {
    const formattedDate = new Date(bookingResult.trial_date + "T00:00:00").toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const trialDateMs = new Date(bookingResult.trial_date + "T00:00:00").getTime();
    const daysUntil = Math.max(0, Math.round((trialDateMs - Date.now()) / 86400000));

    // Always use the BROWSER's real timezone — bypasses any stale localStorage value.
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo";

    // Convert from the slot's source timezone (stored in the booking record from the edge function).
    const SLOT_TZ = bookingResult.timezone || "Africa/Cairo";
    const localized = convertDateTimeToTimezone(bookingResult.trial_date, bookingResult.start_time, SLOT_TZ, userTz);
    const localDate = new Date(localized.dateStr + "T00:00:00");
    const localFormattedDate = localDate.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    // Friendly city name: "Asia/Kuala_Lumpur" → "Kuala Lumpur"
    // Arabic shows an Arabic city name or «بالتوقيت المحلي», never a Latin IANA id.
    const tzCity = language === "ar"
      ? tzLabelAr(userTz)
      : (userTz.includes("/") ? userTz.split("/").pop()!.replace(/_/g, " ") : userTz);
    const slotTzLabel = language === "ar"
      ? tzLabelAr(SLOT_TZ)
      : SLOT_TZ.split("/").pop()?.replace(/_/g, " ");

    // Show source-tz reference line only when the user is in a different timezone
    const isInSlotTz = userTz === SLOT_TZ;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-2xl mx-auto px-4 py-12">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-klovers-green border-2 border-foreground flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-charcoal" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-3">{t("trialBooking.successTitle")}</h1>
              <div className="inline-flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 text-start">
                <CalendarPlus className="h-5 w-5 text-foreground shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{localFormattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {localized.timeFormatted} · {language === "ar" ? toArabicDigits(bookingResult.duration_min) : bookingResult.duration_min} {t("mySchedule.minutes")} · {tzCity}
                  </p>
                  {!isInSlotTz && (
                    <p className="text-[11px] text-muted-foreground/60">
                      ({formattedDate} {bookingResult.start_time_12h} {slotTzLabel})
                    </p>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm max-w-md mx-auto">
                {t("trialBooking.successDesc")}
              </p>

              {/* Change / cancel work on the signed-in student's own rows. A guest
                  manages the booking from the email instead. */}
              {!user && (
                <p className="text-muted-foreground mt-3 text-sm max-w-md mx-auto">
                  {language === "ar"
                    ? "ولتغيير الموعد، المراسلة متاحة عبر واتساب."
                    : "Need a different time? Message us on WhatsApp."}
                </p>
              )}
              <div className={user ? "mt-4 flex flex-wrap items-center justify-center gap-2" : "hidden"}>
                <button
                  onClick={handleReschedule}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-sm font-semibold text-foreground transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarClock className="h-4 w-4 text-foreground" />
                  {t("trialBooking.changeDateBtn")}
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-border bg-card hover:border-destructive/50 hover:bg-destructive/5 text-sm font-semibold text-foreground transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarX className="h-4 w-4 text-destructive" />
                  {cancelling ? t("trialBooking.cancelling") : t("trialBooking.cancelDateBtn")}
                </button>
              </div>

              {/* Inline country selector — updates pricing below in real time */}
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <KloverIcon name="globe-plane" className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {language === "ar" ? "البلد:" : "Your country:"}
                </span>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[130px] border-dashed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_COUNTRIES.map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{countryLabel(c, language === "ar")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground/70">
                  → {getStartingPrice(selectedCountry, language === "ar")}
                </span>
              </div>

              {/* Class language badge on confirmation */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {language === "ar" ? "لغة الحصة:" : "Class language:"}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setClassLanguage("arabic")}
                    className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                      classLanguage === "arabic"
                        ? "border-charcoal bg-charcoal text-ivory dark:border-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {language === "ar" ? "عربي" : "Arabic"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassLanguage("english")}
                    className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                      classLanguage === "english"
                        ? "border-charcoal bg-charcoal text-ivory dark:border-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {language === "ar" ? "إنجليزي" : "English"}
                  </button>
                </div>
              </div>
            </div>

            {/* While-you-wait — single hero CTA. Previous 3-button panel
                got 0 clicks: classic choice paralysis. Collapsing to one
                clear next action (the only one that measurably lifts the
                teacher's trial experience) and downgrading alternatives
                to plain text links. */}
            <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 mb-4 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-bold bg-klovers-yellow text-charcoal border border-charcoal/20 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                <KloverIcon name="lightbulb-sprout" className="h-3.5 w-3.5" />
                {daysUntil > 0 ? (daysUntil === 1 ? t("trialBooking.whileWait") : t("trialBooking.whileWaitPlural")).replace("{days}", language === "ar" ? toArabicDigits(daysUntil) : String(daysUntil)) : t("trialBooking.trialToday")}
              </div>

              <div className="space-y-3">
                {/* WhatsApp — primary action: fastest confirmation + human touch */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "whatsapp" });
                    const url = `${WHATSAPP_BASE}?text=${encodeURIComponent(t("trialBooking.whatsappSuccessMsg"))}`;
                    trackAndOpenWhatsApp(url, { cta_label: "post_booking_whatsapp" });
                  }}
                  className="w-full flex items-center gap-4 bg-klovers-green/10 dark:bg-klovers-green/10 border-2 border-klovers-green rounded-xl p-4 text-start hover:bg-klovers-green/20 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-klovers-green flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-charcoal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{t("trialBooking.whatsappPromptTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("trialBooking.whatsappPromptDesc")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-foreground rtl:rotate-180 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Placement test */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "placement_test" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_placement_test" });
                    navigate("/placement-test");
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-start hover:border-foreground hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-klovers-yellow border border-foreground/20 flex items-center justify-center shrink-0">
                    <KloverIcon name="diploma-scroll" className="h-5 w-5 text-charcoal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t("trialBooking.findLevelTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("trialBooking.findLevelDesc")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Pricing teaser */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "pricing" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_pricing" });
                    navigate("/pricing");
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-start hover:border-foreground hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-klovers-yellow border border-foreground/20 flex items-center justify-center shrink-0">
                    <KloverIcon name="badge-blossom" className="h-5 w-5 text-charcoal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t("trialBooking.peekPlansTitle")}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar"
                        ? `حصص جماعية من ${getStartingPrice(selectedCountry, true)} · مجموعات صغيرة`
                        : `Group classes from ${getStartingPrice(selectedCountry, false)} · small groups`}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Referral / share */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "share" });
                    const shareText = language === "ar"
                      ? "حجزتُ حصة كورية مجانية مع كلوفرز، والتجربة متاحة للجميع."
                      : "Just booked a free Korean class with Klovers. You should try it too.";
                    const shareUrl = "https://kloversegy.com/free-trial";
                    if (navigator.share) {
                      navigator.share({ title: language === "ar" ? "حصة كلوفرز المجانية" : "Klovers Free Trial", text: shareText, url: shareUrl }).catch(() => {});
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-start hover:border-foreground hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-klovers-yellow border border-foreground/20 flex items-center justify-center shrink-0">
                    <Share2 className="h-5 w-5 text-charcoal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {language === "ar" ? "المشاركة مع صديق" : "Tell a friend"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" ? "الحصة المجانية متاحة للجميع، والتجربة أجمل مع صديق" : "Invite a friend to join your free class"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>

            {/* Invite-a-friend card — referral growth loop */}
            <div className="border border-border rounded-2xl p-5 mb-4 bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-1 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-foreground" />
                {language === "ar" ? "صديق يحب الدراما الكورية؟" : "Got a friend who loves K-dramas?"}
              </p>
              {/* Only a signed-in booker gets a ?ref= link; a guest shares the
                  same public free-trial link as everyone, so it is not called
                  "personal" for them. */}
              <p className="text-xs text-muted-foreground mb-3">
                {user
                  ? (language === "ar"
                      ? "رابط شخصي للمشاركة: حصة مجانية للصديق، ومجتمع يكبر معًا."
                      : "Share your personal link — they get a free class, you help grow the community.")
                  : (language === "ar"
                      ? "رابط الحصة المجانية للمشاركة: حصة مجانية للصديق، ومجتمع يكبر معًا."
                      : "Share the free-class link — they get a free class, you help grow the community.")}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralShareUrl}
                  className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-muted-foreground truncate"
                  aria-label={user
                    ? (language === "ar" ? "رابط الإحالة" : "Your referral link")
                    : (language === "ar" ? "رابط الحصة المجانية" : "Free-class link")}
                />
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(referralShareUrl); } catch {}
                    setReferralCopied(true);
                    track.custom("referral_link_copied", { from: "success_screen" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "referral_link_copied" });
                    setTimeout(() => setReferralCopied(false), 2000);
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  aria-label={language === "ar" ? "نسخ رابط الإحالة" : "Copy referral link"}
                >
                  {referralCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  {referralCopied ? (language === "ar" ? "تم النسخ" : "Copied!") : (language === "ar" ? "نسخ" : "Copy")}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => {
                  track.custom("post_trial_cta_clicked", { cta: "pricing" });
                  logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_pricing" });
                  navigate("/pricing");
                }}
                className="hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <KloverIcon name="badge-blossom" className="h-3 w-3" /> {t("trialBooking.peekPlansTitle")}
              </button>
              <span aria-hidden>·</span>
              <button
                onClick={() => {
                  track.custom("post_trial_cta_clicked", { cta: "whatsapp" });
                  const url = `${WHATSAPP_BASE}?text=${encodeURIComponent(t("trialBooking.whatsappSuccessMsg"))}`;
                  trackAndOpenWhatsApp(url, { cta_label: "post_booking_whatsapp" });
                }}
                className="hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" /> {t("trialBooking.whatsappPromptTitle")}
              </button>
              <span aria-hidden>·</span>
              <button
                onClick={() => navigate(user ? "/dashboard" : "/signup")}
                className="hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <LayoutDashboard className="h-3 w-3" /> {user ? t("trialBooking.goDashboard") : (language === "ar" ? "إنشاء حساب مجاني" : "Create a free account")}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Slot picker state ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <section className="py-16 md:py-20 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-3">
              <img
                src="/assets/cluby/cluby-wave.webp"
                width={314}
                height={440}
                alt={language === "ar" ? "كلوبي يلوّح بالترحيب" : "Cluby waving hello"}
                className="h-16 md:h-24 w-auto shrink-0 drop-shadow-md"
                loading="eager"
                decoding="async"
              />
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight text-start">
                {profile?.name ? t("trialBooking.welcomeWithName").replace("{name}", profile.name.split(" ")[0]) : t("trialBooking.welcome")}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("trialBooking.pickDayDesc")}
            </p>
          </div>
        </section>

        <section className="py-12 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-1">{t("trialBooking.pickTimeTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("trialBooking.pickTimeDesc")}{language === "ar"
                  ? (TZ_CITY_AR[Intl.DateTimeFormat().resolvedOptions().timeZone || ""]
                      ? <span className="opacity-70"> ({tzLabelAr(Intl.DateTimeFormat().resolvedOptions().timeZone || "")})</span>
                      : null)
                  : <> <span className="opacity-70">({(Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo").replace(/_/g, " ")})</span></>}
              </p>

              {/* Inline level dropdown — only shown when profile/user_metadata has no level */}
              {needsLevel && (
                <div className="mb-6 space-y-2">
                  <Label htmlFor="trial-level" className="text-sm font-medium">
                    {t("trialBooking.yourLevelLabel")}
                  </Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger id="trial-level">
                      <SelectValue placeholder={t("trialBooking.yourLevelPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_SELECT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("trialBooking.levelHelperText")}
                  </p>
                </div>
              )}

              {/* Show the existing level (read-only) when we already have it */}
              {!needsLevel && profileLoaded && selectedLevel && (
                <p className="text-xs text-muted-foreground mb-4">
                  {t("trialBooking.yourLevelIs")} <span className="font-medium text-foreground">{getLevelShortLabel(selectedLevel)}</span>
                </p>
              )}

              {/* Name and email — only for a guest; a signed-in student's come
                  from the account. */}
              {!user && (
                <div className="mb-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="trial-name" className="text-sm font-medium">
                      {language === "ar" ? "الاسم" : "Your name"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="trial-name"
                      autoComplete="name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="trial-email" className="text-sm font-medium">
                      {language === "ar" ? "البريد الإلكتروني" : "Your email"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="trial-email"
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="text-start"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === "ar"
                        ? "لا حاجة لحساب أو كلمة مرور — يُرسَل رابط الحصة إلى البريد الإلكتروني."
                        : "No account or password needed — we email you the class link."}
                    </p>
                  </div>
                </div>
              )}

              {/* WhatsApp number — always asked, always required. The only
                  second channel this system has when an address bounces. */}
              <div className="mb-4 space-y-1.5">
                <Label htmlFor="trial-phone" className="text-sm font-medium flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  {language === "ar" ? "رقم الواتساب" : "WhatsApp number"}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="trial-phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10 0000 0000"
                  className="text-start"
                />
                <p className="text-xs text-muted-foreground">
                  {language === "ar"
                    ? "يُرسَل رابط الحصة إلى البريد الإلكتروني، ويُستخدم واتساب فقط إن لم يصل البريد."
                    : "We email the class link, and use WhatsApp only if it does not arrive."}
                </p>
              </div>

              {/* Country selector — hidden when profile already has a country */}
              {!(profile?.country?.trim() && ALL_COUNTRIES.includes(profile.country.trim())) && (
                <div className="mb-4 space-y-1.5">
                  <Label htmlFor="trial-country" className="text-sm font-medium flex items-center gap-1.5">
                    <KloverIcon name="globe-plane" className="h-3.5 w-3.5 text-muted-foreground" />
                    {language === "ar" ? "البلد" : "Your country"}
                    <span className="text-[10px] text-muted-foreground font-normal">{language === "ar" ? "(للأسعار)" : "(for pricing)"}</span>
                  </Label>
                  <Select value={selectedCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger id="trial-country">
                      <SelectValue placeholder={language === "ar" ? "اختيار البلد" : "Select your country"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{countryLabel(c, language === "ar")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Class language — auto-detected from country, user can override */}
              <div className="mb-6 space-y-1.5">
                <Label className="text-sm font-medium">
                  {language === "ar" ? "لغة الحصة" : "Class language"}
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClassLanguage("arabic")}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      classLanguage === "arabic"
                        ? "border-charcoal bg-charcoal text-ivory dark:border-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {language === "ar" ? "عربي" : "Arabic"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassLanguage("english")}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      classLanguage === "english"
                        ? "border-charcoal bg-charcoal text-ivory dark:border-klovers-yellow dark:bg-klovers-yellow dark:text-charcoal"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {language === "ar" ? "إنجليزي" : "English"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {language === "ar"
                    ? "اختير تلقائيًا حسب البلد، ويمكن تغييره"
                    : "Auto-selected based on your country — you can change it"}
                </p>
              </div>

              <TrialSlotPicker
                onSelect={handleSlotPicked}
                onBack={() => navigate("/free-trial")}
                classLanguage={classLanguage}
              />

              {loading && (
                <p className="text-sm text-muted-foreground text-center mt-4">{t("trialBooking.bookingTrial")}</p>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                {t("trialBooking.manageFromDashboard")}
                <ArrowRight className="inline h-3 w-3 ml-1" />
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrialBookingPage;

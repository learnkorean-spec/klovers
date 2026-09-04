import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";

type PageState = "loading" | "ready" | "confirming" | "success" | "already" | "error";

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
    language: "Language:",
    date: "Date:",
    time: "Time:",
    tba: "To be announced",
    forTeacher: (t: string) => `That's ${t} for your teacher.`,
    confirmCta: "Confirm my attendance",
    confirming: "Confirming your attendance…",
    confirmedTitle: "Attendance Confirmed!",
    confirmedNew: "You're all set. See you in class!",
    confirmedAlready: "You've already confirmed your attendance. See you in class!",
    accountTitle: "Keep everything in one place",
    accountBody:
      "Create a free account and your class link, materials and reminders all live in your dashboard.",
    accountCta: "Create my account",
    placement: "📝 Take Placement Test",
    pricing: "💰 View Prices",
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
    loading: "بنحمّل بيانات حصتك…",
    greeting: (name: string) => `أهلاً ${name}!`,
    greetingNoName: "أكّد حضورك للحصة التجريبية",
    intro: "اضغط الزرار تحت عشان تأكّد إنك هتحضر الحصة التجريبية.",
    language: "لغة الحصة:",
    date: "التاريخ:",
    time: "الساعة:",
    tba: "هيتحدد قريبًا",
    forTeacher: (t: string) => `ودي ${t} بتوقيت المدرّسة.`,
    confirmCta: "أكّد حضوري",
    confirming: "بنسجّل تأكيدك…",
    confirmedTitle: "تم تأكيد حضورك!",
    confirmedNew: "تمام، كل حاجة جاهزة. نشوفك في الحصة!",
    confirmedAlready: "إنت مأكّد حضورك بالفعل. نشوفك في الحصة!",
    accountTitle: "خلّي كل حاجة في مكان واحد",
    accountBody:
      "اعمل حساب مجاني، وهتلاقي لينك الحصة والمواد والتذكيرات كلها في صفحتك.",
    accountCta: "اعمل حسابك",
    placement: "📝 اختبار تحديد المستوى",
    pricing: "💰 الأسعار",
    joinMeet: "ادخل على Google Meet",
    errorTitle: "اللينك مش شغّال",
    errorBody: "اللينك ده غير صالح أو اتستخدم قبل كده. كلّمنا لو محتاج مساعدة.",
    whatsapp: "كلّمنا على واتساب",
    arabic: "عربي",
    english: "إنجليزي",
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
 * The class as this reader should see it: their own date and their own time.
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
 */
function renderWhen(booking: BookingInfo, locale: string) {
  const { trial_date: date, start_time: time } = booking;
  if (!date || !time) return null;
  const slotTz = booking.timezone || "Africa/Cairo";
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

  const sameZone = viewerTz === slotTz;
  const slotLocal = sameZone ? null : convertDateTimeToTimezone(date, time, slotTz, slotTz);

  return {
    dateLabel,
    timeLabel: `${local.timeFormatted} (${tzCity(viewerTz)})`,
    alsoLabel: slotLocal ? `${slotLocal.timeFormatted} ${tzCity(slotTz)}` : null,
  };
}

const TrialConfirmPage = () => {
  // Transactional page: real content for the signed-in user, nothing a
  // search result should land on. Mirrors the Disallow in robots.txt.
  useSEO({ title: "Trial Confirmation", description: "Confirm your Klovers free trial booking.", noindex: true });

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<PageState>("loading");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [classLink, setClassLink] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    const load = async () => {
      // Read-only, STABLE, no write — safe for a mail client or link
      // scanner to prefetch. The confirming write only happens on a
      // real button click, below.
      const { data, error } = await (supabase.rpc as any)(
        "get_trial_booking_by_token",
        { p_token: token },
      ).maybeSingle();

      if (error || !data) {
        setState("error");
        return;
      }

      setBooking(data);
      setState(data.attendance_response === "yes" ? "already" : "ready");
      fetchClassLink(data.trial_date, data.start_time);
    };

    load();
  }, [token]);

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

  const fetchClassLink = async (trialDate: string | null, startTime: string | null) => {
    if (!trialDate || !startTime) return;
    const { data: slotRow } = await supabase
      .from("trial_slots")
      .select("meeting_url")
      .eq("trial_date", trialDate)
      .eq("start_time", startTime)
      .maybeSingle();
    const url = (slotRow as { meeting_url?: string | null } | null)?.meeting_url ?? null;
    if (url) setClassLink(url);
  };

  const handleConfirm = async () => {
    setState("confirming");

    const { data, error } = await (supabase.rpc as any)(
      "respond_trial_attendance",
      { p_token: token, p_response: "yes" },
    ).maybeSingle();

    if (error || !data) {
      setState("error");
      return;
    }

    setBooking(data);
    setState("success");
  };

  const t = booking?.class_language === "arabic" ? COPY.ar : COPY.en;
  const when = booking && !booking.is_tba ? renderWhen(booking, t.locale) : null;
  const languageLabel =
    booking?.class_language === "arabic"
      ? t.arabic
      : booking?.class_language === "english"
        ? t.english
        : "—";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div
        dir={t.dir}
        lang={t.lang}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
      >
        {/* Logo / brand */}
        <div className="mb-6">
          <span dir="ltr" className="text-4xl font-black tracking-tight text-black">
            K<span className="text-yellow-400">lovers</span>
          </span>
          <p className="text-gray-500 text-sm mt-1">{t.tagline}</p>
        </div>

        {state === "loading" && (
          <div className="py-8">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t.loading}</p>
          </div>
        )}

        {state === "ready" && booking && (
          <div className="py-4">
            <h1 className="text-2xl font-bold text-black mb-1">
              {booking.first_name ? t.greeting(booking.first_name) : t.greetingNoName}
            </h1>
            <p className="text-gray-600 mb-5">{t.intro}</p>
            <div
              className={`bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-700 space-y-1.5 ${
                t.dir === "rtl" ? "text-right" : "text-left"
              }`}
            >
              <p><span className="font-semibold text-black">{t.language}</span> {languageLabel}</p>
              <p>
                <span className="font-semibold text-black">{t.date}</span>{" "}
                {booking.is_tba ? t.tba : when ? when.dateLabel : "—"}
              </p>
              {when && (
                <p>
                  <span className="font-semibold text-black">{t.time}</span> {when.timeLabel}
                  {when.alsoLabel && (
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {t.forTeacher(when.alsoLabel)}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              style={{ backgroundColor: "#000", color: "#FACC15" }}
              className="inline-block font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity"
            >
              {t.confirmCta}
            </button>
          </div>
        )}

        {state === "confirming" && (
          <div className="py-8">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t.confirming}</p>
          </div>
        )}

        {(state === "success" || state === "already") && (
          <div className="py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">{t.confirmedTitle}</h1>
            <p className="text-gray-600 mb-2">
              {state === "already" ? t.confirmedAlready : t.confirmedNew}
            </p>
            {when && (
              <p className="text-sm text-gray-500 mb-6">
                {when.dateLabel} · {when.timeLabel}
              </p>
            )}
            {!when && <div className="mb-6" />}

            {/* Offered only to a reader with no session, and only after they
                have said they are coming. Before that it is one more thing
                between them and the seat. */}
            {hasAccount === false && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="font-semibold text-black text-sm mb-1">{t.accountTitle}</p>
                <p className="text-gray-600 text-sm mb-3">{t.accountBody}</p>
                <a
                  href="/signup"
                  style={{ backgroundColor: "#000", color: "#FACC15" }}
                  className="inline-block font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-80 transition-opacity"
                >
                  {t.accountCta}
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/placement-test"
                style={{ backgroundColor: "#000", color: "#FACC15" }}
                className="inline-block font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity"
              >
                {t.placement}
              </a>
              <a
                href="/pricing"
                style={{ backgroundColor: "#000", color: "#FACC15" }}
                className="inline-block font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity"
              >
                {t.pricing}
              </a>
            </div>
            {classLink && (
              <a
                href={classLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-gray-500 underline hover:text-gray-700"
              >
                {t.joinMeet}
              </a>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">{t.errorTitle}</h1>
            <p className="text-gray-600 mb-6">{t.errorBody}</p>
            <a
              href="https://wa.me/201010003084"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black text-yellow-400 font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              {t.whatsapp}
            </a>
          </div>
        )}

        <p className="text-gray-400 text-xs mt-8">
          <a href="https://kloversegy.com" className="hover:underline">kloversegy.com</a>
        </p>
      </div>
    </div>
  );
};

export default TrialConfirmPage;

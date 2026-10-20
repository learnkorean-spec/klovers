import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CalendarPlus, Clock, Loader2, Clock3 } from "lucide-react";
import { buildGoogleCalendarUrl, formatTime12h } from "@/lib/calendarUrl";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";
import { useLanguage } from "@/contexts/LanguageContext";
import { studentCalendarDaysUntil } from "@/lib/studentDashboardDate";
import { localizeClock } from "@/lib/dashboardLocale";

interface TrialBookingRow {
  id: string;
  trial_date: string;
  start_time: string;
  timezone: string | null;
  level: string | null;
  status: "pending" | "confirmed";
  is_tba: boolean | null;
  rollover_status: "pending_notification" | "notified" | null;
}

const TRIAL_DURATION_MIN = 45;

function formatDate(d: string, language: "en" | "ar", t: (k: string) => string) {
  const date = new Date(d + "T12:00:00");
  const days = daysUntil(d);
  if (days === 0) return t("dashboardPage.todayPlain");
  if (days === 1) return t("dashboardPage.tomorrowPlain");
  const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  return date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
}

/** Same calendar-day rule as the Next Class card, in the timezone the class is shown in. */
function daysUntil(d: string) {
  return studentCalendarDaysUntil(d, getUserTimezone());
}

const MyTrialClassCard = () => {
  const { t, tPlural, language } = useLanguage();
  const [booking, setBooking] = useState<TrialBookingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { setLoading(false); return; }

      const { data } = await supabase
        .from("trial_bookings")
        .select("id, trial_date, start_time, timezone, level, status, is_tba, rollover_status")
        .eq("user_id", session.user.id)
        .in("status", ["pending", "confirmed"])
        .order("trial_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) setBooking(data as TrialBookingRow);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!booking) return null;

  // Group didn't reach the minimum to run — not a no-show, not lost, just
  // needs a new date once next month's schedule is up.
  if (booking.rollover_status) {
    return (
      <Card className="border-amber-300/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-500" />
            {t("dashboardPage.myTrialClass")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base leading-tight">{t("dashboardPage.trialPostponedTitle")}</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  {booking.rollover_status === "notified"
                    ? t("dashboardPage.trialPostponedNotified")
                    : t("dashboardPage.trialPostponedPending")}
                </p>
                <a
                  href="/trial-booking"
                  className="mt-3 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg shadow transition-all text-sm"
                >
                  {t("dashboardPage.bookNewTrial")}
                </a>
              </div>
              <Badge className="bg-amber-500 flex-shrink-0">{t("dashboardPage.postponed")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // TBA placeholder — user is on waitlist, no confirmed date yet
  if (booking.is_tba) {
    return (
      <Card className="border-amber-300/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-500" />
            {t("dashboardPage.myTrialClass")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base leading-tight">{t("dashboardPage.waitlistTitle")}</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  {t("dashboardPage.waitlistBody")}
                </p>
              </div>
              <Badge className="bg-amber-500 flex-shrink-0">{t("dashboardPage.waitlist")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConfirmed = booking.status === "confirmed";
  const timezone = booking.timezone || "Africa/Cairo";
  const userTz = getUserTimezone();
  const local = convertDateTimeToTimezone(booking.trial_date, booking.start_time, timezone, userTz);
  const days = daysUntil(local.dateStr);

  const calendarUrl = buildGoogleCalendarUrl({
    title: "Free Korean Trial Class by Klovers Academy",
    date: booking.trial_date,
    time: booking.start_time,
    durationMin: TRIAL_DURATION_MIN,
    description: `Trial class with Klovers Academy.\nLevel: ${booking.level || "Beginner"}\nhttps://kloversegy.com`,
    timezone,
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {t("dashboardPage.myTrialClass")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex flex-wrap-reverse items-end justify-between gap-3 sm:flex-nowrap sm:items-start">
            <div className="flex-1 min-w-[12rem]">
              <p className="font-bold text-foreground text-lg">{formatDate(local.dateStr, language, t)}</p>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1 mt-1 break-words">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span dir="ltr">{localizeClock(local.timeFormatted, language)}</span> · {TRIAL_DURATION_MIN} {t("dashboardPage.minutesShort")} · <span dir="ltr">{userTz.replace(/_/g, " ")}</span>
              </p>
              <p className="text-[11px] text-muted-foreground/70 break-words">({formatDate(booking.trial_date, language, t)} <span dir="ltr">{localizeClock(formatTime12h(booking.start_time), language)}</span> <span dir="ltr">{timezone.replace(/_/g, " ")}</span>)</p>

              {isConfirmed ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg shadow transition-all text-sm"
                  aria-label={t("dashboardPage.addToCalendarAria")}
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  {t("dashboardPage.addToCalendar")}
                </a>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">
                  {t("dashboardPage.waitingConfirmation")}
                </p>
              )}
            </div>
            <Badge className={`shrink-0 ${isConfirmed ? "bg-green-500" : "bg-amber-500"}`}>
              {isConfirmed
                ? (days === 0 ? t("dashboardPage.todayBadge") : days === 1 ? t("dashboardPage.tomorrowBadge") : tPlural("dashboardPage.inDaysShortPlural", days))
                : t("dashboardPage.pendingLabel")}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTrialClassCard;

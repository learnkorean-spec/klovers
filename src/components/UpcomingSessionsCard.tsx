import { studentCalendarDaysUntil } from "@/lib/studentDashboardDate";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Loader2, Video } from "lucide-react";

interface UpcomingSession {
  session_id: string;
  session_date: string;
  group_name: string;
  start_time: string;
  duration_min: number;
  timezone: string | null;
  level: string;
  attendance_status: string | null;
}

import { formatTime, convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizeClock } from "@/lib/dashboardLocale";
import { getLevelShortLabel } from "@/constants/levels";

function tzOffsetMs(date: Date, tz: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date).reduce((a, x) => { a[x.type] = x.value; return a; }, {} as Record<string, string>);
  const h = p.hour === "24" ? 0 : +p.hour;
  return Date.UTC(+p.year, +p.month - 1, +p.day, h, +p.minute, +p.second) - date.getTime();
}

function formatDate(d: string, language: "en" | "ar", t: (k: string) => string) {
  const date = new Date(d + "T12:00:00");
  const days = daysUntil(d);
  if (days === 0) return t("dashboardPage.todayPlain");
  if (days === 1) return t("dashboardPage.tomorrowPlain");
  const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  return date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
}

function daysUntil(d: string) {
  return studentCalendarDaysUntil(d, getUserTimezone());
}

/** Returns true if the class is within the window (10 min before → end). Works across timezones. */
function isClassActive(sessionDate: string, startTime: string, durationMin: number, sourceTz: string): boolean {
  const [y, mo, d] = sessionDate.split("-").map(Number);
  const [h, mi] = startTime.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const startMs = guess - tzOffsetMs(new Date(guess), sourceTz);
  const openMs = startMs - 10 * 60 * 1000;
  const closeMs = startMs + durationMin * 60 * 1000;
  const nowMs = Date.now();
  return nowMs >= openMs && nowMs <= closeMs;
}

interface Props {
  sessions?: UpcomingSession[];
  zoomUrl?: string | null;
  showJoinAction?: boolean;
}

const UpcomingSessionsCard = ({ sessions: sessionsProp, zoomUrl: zoomUrlProp, showJoinAction = true }: Props = {}) => {
  const navigate = useNavigate();
  const { t, tPlural, language } = useLanguage();
  const usingProps = sessionsProp !== undefined;
  const [sessionsState, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(!usingProps);
  const [zoomUrlState, setZoomUrl] = useState<string | null>(null);

  // Single source of truth lives in StudentDashboard: when sessions/zoomUrl
  // are passed as props, reuse them and skip the duplicate RPC + settings
  // fetch. Otherwise (standalone use) fall back to fetching directly.
  const sessions = sessionsProp ?? sessionsState;
  const zoomUrl = zoomUrlProp ?? zoomUrlState;

  useEffect(() => {
    if (sessionsProp !== undefined) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [sessRes, zoomRes] = await Promise.all([
        (supabase as any).rpc("get_student_upcoming_sessions", { p_user_id: session.user.id }),
        (supabase as any).from("app_settings").select("value").eq("key", "zoom_meeting_url").maybeSingle(),
      ]);

      if (!sessRes.error && sessRes.data) setSessions(sessRes.data);
      if (!zoomRes.error && zoomRes.data) setZoomUrl((zoomRes.data as any).value || null);
      setLoading(false);
    };
    load();
  }, [sessionsProp]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    // Priority 3: never disappear — keep the header with an empty state.
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t("dashboardPage.upcomingClasses")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("dashboardPage.noUpcomingScheduled")}
          </p>
          {showJoinAction && (
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/schedule")}>
              {t("dashboardPage.manageSchedule")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const next = sessions[0];
  const userTz = getUserTimezone();
  const nextLocal = convertDateTimeToTimezone(next.session_date, next.start_time, next.timezone || "Africa/Cairo", userTz);
  const days = daysUntil(nextLocal.dateStr);
  const classActive = isClassActive(next.session_date, next.start_time, next.duration_min, next.timezone || "Africa/Cairo");

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {t("dashboardPage.upcomingClasses")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next class highlight */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex flex-wrap-reverse items-end justify-between gap-3 sm:flex-nowrap sm:items-start">
            <div className="flex-1 min-w-[12rem]">
              <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1">{t("dashboardPage.nextClass")}</p>
              <p className="font-bold text-foreground text-lg">{formatDate(nextLocal.dateStr, language, t)}</p>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1 mt-1 break-words">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span dir="ltr">{localizeClock(nextLocal.timeFormatted, language)}</span> · {next.duration_min} {t("dashboardPage.minutesShort")} · <span dir="ltr">{userTz.replace(/_/g, " ")}</span>
              </p>
              <p className="text-[11px] text-muted-foreground break-words">({formatDate(next.session_date, language, t)} <span dir="ltr">{localizeClock(formatTime(next.start_time), language)}</span> <span dir="ltr">{(next.timezone || "Africa/Cairo").replace(/_/g, " ")}</span>)</p>
              <p className="text-xs text-muted-foreground mt-1">{next.group_name} · {getLevelShortLabel(next.level, language) || next.level}</p>

              {/* Join Class button */}
              {showJoinAction && zoomUrl && days === 0 && (
                <a
                  href={zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2"
                >
                  <Button
                    size="sm"
                    className={`gap-1.5 font-bold shadow-md transition-all ${
                      classActive
                        ? "bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-green-500/30"
                        : "opacity-70"
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    {classActive ? t("dashboardPage.joinClassNow") : t("dashboardPage.classLink")}
                  </Button>
                </a>
              )}
            </div>
            <Badge className={`shrink-0 ${days === 0 ? "bg-green-500" : days === 1 ? "bg-yellow-500" : "bg-primary"}`}>
              {days === 0 ? t("dashboardPage.todayBadge") : days === 1 ? t("dashboardPage.tomorrowBadge") : tPlural("dashboardPage.inDaysPlural", days)}
            </Badge>
          </div>
        </div>

        {/* Remaining sessions */}
        {sessions.slice(1).map(s => {
          const l = convertDateTimeToTimezone(s.session_date, s.start_time, s.timezone || "Africa/Cairo", userTz);
          return (
          <div key={s.session_id} className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{formatDate(l.dateStr, language, t)}</p>
              <p className="text-xs text-muted-foreground break-words"><span dir="ltr">{localizeClock(l.timeFormatted, language)}</span> · {s.group_name}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{tPlural("dashboardPage.inDaysShortPlural", daysUntil(l.dateStr))}</span>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingSessionsCard;

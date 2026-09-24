import { studentCalendarDaysUntil } from "@/lib/studentDashboardDate";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  Video,
  CalendarCheck,
  GraduationCap,
  Phone,
} from "lucide-react";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizeClock } from "@/lib/dashboardLocale";
import { getLevelShortLabel } from "@/constants/levels";

/**
 * Condensed "what should I do next?" summary that lives directly under the
 * dashboard Hero. Reuses the same timezone helpers as UpcomingSessionsCard so
 * the date/time the student sees here matches the full card further down.
 */
export interface PrimarySession {
  session_id: string;
  session_date: string;
  group_name: string;
  start_time: string;
  duration_min: number;
  timezone: string | null;
  level: string;
  attendance_status: string | null;
}

export interface PrimaryEnrollment {
  id: string;
  sessions_total: number;
  sessions_remaining: number;
  plan_type: string;
}

export interface PrimaryPendingEnrollment {
  id: string;
  plan_type: string;
  approval_status: string;
}

export interface PrimaryChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

interface Props {
  enrollments: PrimaryEnrollment[];
  attendanceDates: { date: string }[];
  nextSession: PrimarySession | null;
  zoomUrl: string | null;
  pendingEnrollments: PrimaryPendingEnrollment[];
  checklistItems: PrimaryChecklistItem[];
}

const WHATSAPP = "https://wa.me/201010003084";

function formatDate(d: string, language: "en" | "ar", t: (k: string) => string) {
  const date = new Date(d + "T12:00:00");
  const days = daysUntil(d);
  if (days === 0) return t("dashboardPage.todayPlain");
  if (days === 1) return t("dashboardPage.tomorrowPlain");
  const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  return date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
}

/** Days are compared in the same timezone used to display the class. */
function daysUntil(d: string) {
  return studentCalendarDaysUntil(d, getUserTimezone());
}

function dayBadge(
  days: number,
  t: (k: string) => string,
  tPlural: (path: string, count: number) => string
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (days <= 0) return { label: t("dashboardPage.todayBadge"), variant: "default" };
  if (days === 1) return { label: t("dashboardPage.tomorrowBadge"), variant: "secondary" };
  return { label: tPlural("dashboardPage.inDaysPlural", days), variant: "outline" };
}

const pendingLabel = (approval: string, t: (k: string) => string) =>
  approval === "PENDING_PAYMENT"
    ? t("dashboardPage.awaitingPayment")
    : approval === "UNDER_REVIEW"
      ? t("dashboardPage.underReview")
      : t("dashboardPage.pendingLabel");

/* === COMPONENT BODY (appended below) === */

export const StudentPrimaryAction = ({
  enrollments,
  attendanceDates,
  nextSession,
  zoomUrl,
  pendingEnrollments,
  checklistItems,
}: Props) => {
  const navigate = useNavigate();
  const { t, tInterpolate, tPlural, language } = useLanguage();
  const planLabel = (plan: string) => {
    const p = (plan || "").toLowerCase();
    if (p === "group") return t("dashboardPage.planGroup");
    if (p === "private") return t("dashboardPage.planPrivate");
    return plan;
  };

  // ── Compute sessions remaining (same basis as the package summary card)
  const activeEnrollment = enrollments[0];
  const remaining = activeEnrollment
    ? activeEnrollment.sessions_total - attendanceDates.length
    : null;

  // Priority 1E: first incomplete registration field, shared by the
  // profile-completion warning so Fix opens the actual missing field.
  const FIELD_KEY_BY_ITEM_KEY: Record<string, string> = {
    "Full name": "name",
    "Korean level": "level",
    "Country": "country",
    "Timezone": "timezone",
    "Preferred class days": "days",
  };
  const firstIncomplete = checklistItems.find((i) => !i.completed);
  const firstIncompleteParam = firstIncomplete
    ? (FIELD_KEY_BY_ITEM_KEY[firstIncomplete.key] ?? firstIncomplete.key)
    : null;
  const profileCompletion =
    checklistItems.length > 0 && firstIncomplete
      ? {
          done: checklistItems.filter((i) => i.completed).length,
          total: checklistItems.length,
          label: firstIncomplete.label,
          param: firstIncompleteParam,
        }
      : null;

  // ── State D: pending enrollment (no active APPROVED+PAID enrollment)
  if (!nextSession && !activeEnrollment && pendingEnrollments.length > 0) {
    const pe = pendingEnrollments[pendingEnrollments.length - 1];
    return (
      <Card className="border-amber-300/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            {t("dashboardPage.enrollmentPendingTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tInterpolate(t("dashboardPage.enrollmentPendingBody1"), { plan: planLabel(pe.plan_type), status: pendingLabel(pe.approval_status, t) })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("dashboardPage.startJourneyShort")}
          </p>
        </CardContent>
      </Card>
    );
  }
  /* === BODY PART 2 (appended below) === */

  // ── Unenrolled, no pending → State F: start the journey
  if (!nextSession && !activeEnrollment && pendingEnrollments.length === 0) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-transparent ring-1 ring-black/10">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="flex items-start gap-4">
            <BrandIcon name="open-book" className="h-12 w-12 sm:h-14 sm:w-14" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{t("dashboardPage.startJourneyTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("dashboardPage.startJourneyBody")}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => navigate("/enroll-now")} size="lg" className="flex-1">
              {t("dashboardPage.enrollNow")}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/free-trial")} className="flex-1">
              {t("dashboardPage.bookFreeTrial")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── From here the student has an active enrollment ──

  // ── State C: package completed (sessions used up)
  if (!nextSession && remaining !== null && remaining <= 0 && attendanceDates.length > 0) {
    return (
      <Card className="border-green-500 border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-green-600" />
            {t("dashboardPage.packageCompletedTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tInterpolate(t("dashboardPage.packageCompletedBody"), { count: activeEnrollment!.sessions_total, plan: planLabel(activeEnrollment!.plan_type) })}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => navigate("/enroll-now")} className="flex-1">
              {t("dashboardPage.renewPackage")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                trackAndOpenWhatsApp(
                  `${WHATSAPP}?text=${encodeURIComponent("Hi! I just finished my Klovers package and would like to renew.")}`,
                  { cta_label: "primary_action_renew_contact" }
                )
              }
            >
              <Phone className="h-4 w-4 me-1.5" />
              {t("dashboardPage.contactKlovers")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
    /* === BODY PART 3 (appended below) === */

  // ── State A: upcoming class exists
  if (nextSession) {
    const userTz = getUserTimezone();
    const local = convertDateTimeToTimezone(
      nextSession.session_date,
      nextSession.start_time,
      nextSession.timezone || "Africa/Cairo",
      userTz
    );
    const days = daysUntil(local.dateStr);
    const { label: dayLabel, variant } = dayBadge(Math.max(0, days), t, tPlural);

    return (
      <div className="space-y-3">
      {profileCompletion && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl px-3 py-2 text-sm">
          <span className="text-base">⚠️</span>
          <span className="flex-1 font-medium text-amber-800 dark:text-amber-300">
            {tInterpolate(t("dashboardPage.profileCompleteAdd"), { pct: Math.round((profileCompletion.done / profileCompletion.total) * 100), field: profileCompletion.label })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 shrink-0 px-2"
            onClick={() => navigate(`/dashboard?complete=${encodeURIComponent(profileCompletion.param ?? "name")}`)}
          >
            {t("dashboardPage.fixArrow")}
          </Button>
        </div>
      )}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t("dashboardPage.nextClass")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-lg">{formatDate(local.dateStr, language, t)}</p>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1 mt-1 break-words">
                <Clock className="h-3.5 w-3.5" />
                <span dir="ltr">{localizeClock(local.timeFormatted, language)}</span> · {nextSession.duration_min} {t("dashboardPage.minutesShort")} ·{" "}
                <span dir="ltr">{userTz.replace(/_/g, " ")}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {nextSession.group_name} · {getLevelShortLabel(nextSession.level, language) || nextSession.level}
              </p>
              {remaining !== null && remaining <= 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {tInterpolate(t("dashboardPage.packageBalanceNote"), { count: remaining })}
                </p>
              )}
              {remaining !== null && remaining > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {tInterpolate(t("dashboardPage.sessionsRemainingSuffix"), { count: remaining })}
                </p>
              )}
            </div>
            <Badge variant={variant} className="shrink-0">{dayLabel}</Badge>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>button]:min-h-11 [&>a]:min-h-11">
            {zoomUrl && days === 0 ? (
              <Button
                size="sm"
                className="gap-1.5 font-bold shadow-md bg-green-600 hover:bg-green-700 text-white"
                asChild
              >
                <a href={zoomUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4" />
                  {t("dashboardPage.joinClass")}
                </a>
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate("/dashboard/schedule")}>
                <CalendarCheck className="h-4 w-4 me-1.5" />
                {t("dashboardPage.manageSchedule")}
              </Button>
            )}
            {zoomUrl && days === 0 && (
              <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard/schedule")}>
                {t("dashboardPage.manageSchedule")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  // ── State B: active enrollment, no upcoming class
  return (
    <div className="space-y-3">
      {profileCompletion && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl px-3 py-2 text-sm">
          <span className="text-base">⚠️</span>
          <span className="flex-1 font-medium text-amber-800 dark:text-amber-300">
            {tInterpolate(t("dashboardPage.profileCompleteAdd"), { pct: Math.round((profileCompletion.done / profileCompletion.total) * 100), field: profileCompletion.label })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 shrink-0 px-2"
            onClick={() => navigate(`/dashboard?complete=${encodeURIComponent(profileCompletion.param ?? "name")}`)}
          >
            {t("dashboardPage.fixArrow")}
          </Button>
        </div>
      )}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {t("dashboardPage.noUpcomingClass")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {remaining !== null && remaining >= 0
              ? tInterpolate(t("dashboardPage.noUpcomingBodyWithSessions"), { count: remaining })
              : t("dashboardPage.noUpcomingBodyNoSessions")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>button]:min-h-11">
            <Button size="sm" onClick={() => navigate("/dashboard/schedule")}>
              {t("dashboardPage.manageSchedule")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                trackAndOpenWhatsApp(
                  `${WHATSAPP}?text=${encodeURIComponent("Hi! I'd like to book my next Korean class.")}`,
                  { cta_label: "primary_action_book_class" }
                )
              }
            >
              <Phone className="h-4 w-4 me-1.5" />
              {t("dashboardPage.whatsappBookClass")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPrimaryAction;


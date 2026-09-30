import React, { lazy, Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetGate } from "@/hooks/useResetGate";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyStepper from "@/components/JourneyStepper";
import UpcomingSessionsCard from "@/components/UpcomingSessionsCard";
import MyTrialClassCard from "@/components/MyTrialClassCard";
import StudentPrimaryAction from "@/components/StudentPrimaryAction";
import type { PrimarySession } from "@/components/StudentPrimaryAction";
import StudentAttendanceRequest from "@/components/StudentAttendanceRequest";
import StudentSelfService from "@/components/StudentSelfService";
import AvatarUpload from "@/components/AvatarUpload";
import RegistrationChecklist from "@/components/RegistrationChecklist";
import { useGamification } from "@/hooks/useGamification";
import { useLanguage } from "@/contexts/LanguageContext";
import { BADGES, LEAGUES } from "@/constants/gamification";
// Korean scene photos for immersive gallery
import imgJeju from "@/assets/blog/jeju-island.jpg";
import imgBBQ from "@/assets/blog/korean-bbq.jpg";
import imgTemple from "@/assets/blog/korean-temple.jpg";
import imgHanbok from "@/assets/blog/hanbok-fashion.jpg";
import imgKpop from "@/assets/blog/kpop-concert.jpg";
import imgNightMarket from "@/assets/blog/korean-nightmarket.jpg";
import imgTea from "@/assets/blog/korean-tea.jpg";
import imgMarket from "@/assets/blog/korean-market.jpg";
// Below-fold components — lazy loaded to keep initial paint fast
const AnalyticsSection = lazy(() =>
  import("@/components/AnalyticsSection").then(m => ({ default: m.AnalyticsSection }))
);
const AchievementMilestoneCard = lazy(() =>
  import("@/components/AchievementMilestoneCard").then(m => ({ default: m.AchievementMilestoneCard }))
);
const LearningGoalsCard = lazy(() =>
  import("@/components/LearningGoalsCard").then(m => ({ default: m.LearningGoalsCard }))
);
const LeaderboardCard = lazy(() =>
  import("@/components/LeaderboardCard").then(m => ({ default: m.LeaderboardCard }))
);
const StreakCalendar = lazy(() =>
  import("@/components/StreakCalendar").then(m => ({ default: m.StreakCalendar }))
);
const DailyBonusCard = lazy(() =>
  import("@/components/DailyBonusCard").then(m => ({ default: m.DailyBonusCard }))
);
import { AlertCircle, AlertTriangle, Package, CalendarCheck, Users, GraduationCap, RotateCcw, ChevronDown, Pencil, Check, X, Download, Copy } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import WorldEntryCard from "@/components/games/WorldEntryCard";
import { Input } from "@/components/ui/input";
import { toast, useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLevelShortLabel } from "@/constants/levels";
import WelcomeModal, { isOnboardingDone } from "@/components/WelcomeModal";
import { leagueName, badgeText } from "@/lib/dashboardLocale";
import { useDashboardLearning } from "@/hooks/useDashboardLearning";
import {
  xpStatus, streakState as getStreakState, localDateKey, missionsFromActivity, pickContinueLesson,
  journeyStops, eggStatus, WORD_OF_DAY_ACTIVITY, type BrandIconName,
} from "@/lib/dashboardProgress";
import { dashEvent, markMissionCompletedOnce } from "@/lib/dashboardEvents";
import { markClubyAwake } from "@/lib/clubyAwake";
import { studentCalendarDaysUntil } from "@/lib/studentDashboardDate";
import { getUserTimezone } from "@/lib/viewerTimezone";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { DashboardHero } from "@/components/student-dashboard/premium/DashboardHero";
import { ContinueLearningCard } from "@/components/student-dashboard/premium/ContinueLearningCard";
import { TodaysMissions } from "@/components/student-dashboard/premium/TodaysMissions";
import { LearningJourneyMap } from "@/components/student-dashboard/premium/LearningJourneyMap";
import { CollectionCard } from "@/components/student-dashboard/premium/CollectionCard";
import { EggStatusCard } from "@/components/student-dashboard/premium/EggStatusCard";
import { RecentAchievements } from "@/components/student-dashboard/premium/RecentAchievements";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { useDashCopy } from "@/components/student-dashboard/premium/copy";

interface EnrollmentRecord {
  id: string;
  plan_type: string;
  duration: number;
  sessions_total: number;
  sessions_remaining: number;
  unit_price: number;
  amount: number;
  currency: string;
  created_at: string;
  level: string | null;
  preferred_days: string[] | null;
  timezone: string | null;
}

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

interface AttendanceDate {
  date: string;
  source: string;
}

interface PlacementTestResult {
  score: number;
  level: string;
  created_at: string;
}

const AttendanceHistoryCard = ({ dates }: { dates: AttendanceDate[] }) => {
  const { t, tInterpolate, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const dateLocale = language === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex min-h-12 w-full items-center justify-between gap-2 rounded-lg px-6 py-4 text-start hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                {tInterpolate(t("dashboardPage.attendanceHistory"), { count: dates.length })}
              </CardTitle>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-1">
              {dates.map((d, i) => (
                <div key={`${d.date}-${i}`} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-end">{i + 1}.</span>
                    <CalendarCheck className="h-4 w-4 text-charcoal dark:text-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {new Date(d.date + "T00:00:00").toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const ProfileCard = ({
  userId, avatarUrl, displayName, enrollmentCount, journeyStage,
  onAvatarUploaded, onNameUpdated,
}: {
  userId: string; avatarUrl: string; displayName: string; enrollmentCount: number;
  journeyStage: number; onAvatarUploaded: (url: string) => void; onNameUpdated: (name: string) => void;
}) => {
  const { t, tPlural } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingName) setNameValue(displayName);
  }, [displayName, editingName]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === displayName) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: nameValue.trim() }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: t("dashboardPage.errorTitle"), description: t("dashboardPage.couldNotUpdateName"), variant: "destructive" });
      return;
    }
    toast({ title: t("dashboardPage.nameUpdated") });
    onNameUpdated(nameValue.trim());
    setEditingName(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <AvatarUpload userId={userId} currentUrl={avatarUrl} name={displayName} onUploaded={onAvatarUploaded} />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-[180px] max-w-full text-sm"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={handleSaveName} disabled={saving} aria-label={t("dashboardPage.saveNameAria")}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => { setEditingName(false); setNameValue(displayName); }} aria-label={t("dashboardPage.cancelEditAria")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-semibold text-foreground text-lg truncate" title={displayName} dir="auto">{displayName}</p>
                <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => { setNameValue(displayName); setEditingName(true); }} aria-label={t("dashboardPage.editNameAria")}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{tPlural("dashboardPage.activePackage", enrollmentCount)}</p>
          </div>
        </div>
        <JourneyStepper currentStage={journeyStage} />
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  useSEO({ title: "My Dashboard", description: "Track your Korean learning progress, schedule, and achievements on Klovers.", canonical: "https://kloversegy.com/dashboard" });
  const { t, tInterpolate, tPlural, language } = useLanguage();
  const { loading: gateLoading, resetBlocked } = useResetGate();
  const { progress: gamification, league, loading: gamLoading, awardGameXp, leaguePromotion, newBadges, streakCelebration, clearLeaguePromotion, clearNewBadges, clearStreakCelebration } = useGamification();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [userName, setUserName] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [profileLevel, setProfileLevel] = useState("");
  const [placementTest, setPlacementTest] = useState<PlacementTestResult | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  // A private (1:1) student lives in teacher_students + student_bundles, not
  // enrollments. Without this flag she counted as "no data" and saw the
  // Enroll Now card instead of her own lessons and package.
  const [isPrivate, setIsPrivate] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [latestEnrollmentId, setLatestEnrollmentId] = useState("");
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
      const [pendingEnrollments, setPendingEnrollments] = useState<{ id: string; plan_type: string; approval_status: string }[]>([]);
  // Full upcoming-session list (single source of truth — passed to both
  // StudentPrimaryAction ([0]) and UpcomingSessionsCard, so the RPC + zoom
  // URL are each fetched exactly once).
  const [upcomingSessions, setUpcomingSessions] = useState<PrimarySession[]>([]);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const vocabStorageKey = `vocab_xp_${new Date().toISOString().split("T")[0]}`;
  const [vocabClaimed, setVocabClaimed] = useState(() => !!localStorage.getItem(`vocab_xp_${new Date().toISOString().split("T")[0]}`));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast: uiToast } = useToast();

  useEffect(() => {
    const messages: string[] = [];
    const badges = [...new Set(newBadges)].map(key => BADGES.find(badge => badge.key === key)).filter(Boolean);
    const sep = language === "ar" ? "، " : ", ";
    if (badges.length) messages.push(tInterpolate(t("dashboardPage.badgesUnlocked"), { names: badges.map(badge => badgeText(badge!, language).name).join(sep) }));
    if (streakCelebration !== null) messages.push(tInterpolate(t("dashboardPage.streakMilestone"), { count: streakCelebration }));
    if (leaguePromotion) {
      const promoted = LEAGUES.find(item => item.key === leaguePromotion.toLeague);
      messages.push(tInterpolate(t("dashboardPage.promotedTo"), { league: promoted ? leagueName(promoted, language) : leaguePromotion.toLeague }));
    }
    // Gamification stays secondary: a toast, never a fullscreen takeover.
    if (messages.length) uiToast({ title: t("dashboardPage.achievementEarned"), description: messages.join(" "), duration: 5000 });
    if (newBadges.length) clearNewBadges();
    if (streakCelebration !== null) clearStreakCelebration();
    if (leaguePromotion) clearLeaguePromotion();
  }, [newBadges, streakCelebration, leaguePromotion, uiToast, clearNewBadges, clearStreakCelebration, clearLeaguePromotion, t, tInterpolate, language]);

  const FIELD_MAP: Record<string, string> = {
    name: "Full name",
    level: "Korean level",
    country: "Country",
    timezone: "Timezone",
    days: "Preferred class days",
  };

  const completeParam = searchParams.get("complete");
  const autoFocusField = completeParam ? FIELD_MAP[completeParam] || undefined : undefined;

  useEffect(() => {
    if (completeParam) {
      setSearchParams({}, { replace: true });
    }
  }, [completeParam, setSearchParams]);

  useEffect(() => {
    if (gateLoading || resetBlocked) return;
    const load = async () => {
      try {
      setFetchError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);

      // Referral count
      const { count: refCount } = await supabase
        .from("referral_conversions")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", session.user.id)
        .eq("xp_awarded", true);
      setReferralCount(refCount || 0);

      // Pending enrollments
      const { data: pendingEnrollData } = await supabase
        .from("enrollments")
        .select("id, plan_type, approval_status")
        .eq("user_id", session.user.id)
        .in("approval_status", ["PENDING_PAYMENT", "UNDER_REVIEW", "PENDING"]);
      setPendingEnrollments(pendingEnrollData || []);

      // Weekly XP: from Monday 00:00 local time
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const { data: weeklyXpData } = await supabase
        .from("student_xp")
        .select("xp_earned")
        .eq("user_id", session.user.id)
        .gte("created_at", monday.toISOString());
      setWeeklyXp((weeklyXpData || []).reduce((s: number, r: any) => s + (r.xp_earned || 0), 0));

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, name, level, course_level_key, country, phone")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
        setProfilePhone(((profile as any).phone as string | null) || "");
        setUserName(profile.name || "");
        // course_level_key is the column the placement test writes; `level` is the
        // older, hand-edited one. Of the 21 accounts that have taken a placement
        // test, all 21 have course_level_key and only 11 have `level` — reading
        // `level` alone showed ten students an empty card and a "Take Test"
        // button for a test they had already finished.
        setProfileLevel((profile as any).course_level_key || profile.level || "");
      }

      // Fetch latest placement test result
      const { data: ptData } = await supabase
        .from("placement_tests")
        .select("score, level, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ptData) {
        setPlacementTest(ptData as PlacementTestResult);
      }

      const { data: rosterRow, error: rosterErr } = await supabase
        .from("teacher_students")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (rosterErr) console.error("teacher_students lookup failed:", rosterErr.message);
      setIsPrivate(Boolean(rosterRow?.id));

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id, plan_type, duration, sessions_total, sessions_remaining, unit_price, amount, currency, created_at, preferred_days, timezone, level")
        .eq("user_id", session.user.id)
        .eq("approval_status", "APPROVED")
        .eq("payment_status", "PAID")
        .order("created_at", { ascending: false });

      if (enrollmentData && enrollmentData.length > 0) {
        setEnrollments(enrollmentData as EnrollmentRecord[]);
        const latestEnroll = enrollmentData[0];
        setLatestEnrollmentId(latestEnroll.id);

        // Auto-sync: fill profile gaps from enrollment data
        const p = profile;
        const autoUpdates: Record<string, string> = {};
        if ((!p?.level || !p.level.trim()) && latestEnroll.level && latestEnroll.level.trim()) {
          autoUpdates.level = latestEnroll.level.trim();
        }
        if ((!p?.name || !p.name.trim()) && session.user.user_metadata?.name) {
          autoUpdates.name = session.user.user_metadata.name;
        }
        if (Object.keys(autoUpdates).length > 0) {
          await supabase.from("profiles").update(autoUpdates).eq("user_id", session.user.id);
          if (autoUpdates.name) setUserName(autoUpdates.name);
        }

        // course_level_key counts here too, or a student whose level came from
        // the placement test keeps being nagged that their profile is incomplete.
        const effectiveLevel = autoUpdates.level || p?.level || (p as any)?.course_level_key || "";
        const effectiveName = autoUpdates.name || p?.name || "";

        const items: ChecklistItem[] = [
          { key: "Full name", label: t("dashboardPage.fieldFullName"), completed: !!(effectiveName && effectiveName.trim() !== "") },
          { key: "Korean level", label: t("dashboardPage.fieldKoreanLevel"), completed: !!(effectiveLevel && effectiveLevel.trim() !== "") },
          { key: "Country", label: t("dashboardPage.fieldCountry"), completed: !!(p?.country && p.country.trim() !== "") },
          { key: "Preferred class days", label: t("dashboardPage.fieldPreferredDays"), completed: !!(latestEnroll.preferred_days && latestEnroll.preferred_days.length > 0) },
          { key: "Timezone", label: t("dashboardPage.fieldTimezone"), completed: !!(latestEnroll.timezone && latestEnroll.timezone.trim() !== "") },
        ];
        setChecklistItems(items);

        // Fetch all attendance dates from all sources
        const latestId = latestEnroll.id;
        const [adminRes, pkgRes, selfRes] = await Promise.all([
          supabase
            .from("admin_attendance_log")
            .select("session_date")
            .eq("enrollment_id", latestId),
          supabase
            .from("pkg_attendance")
            .select("session_id, pkg_group_sessions(session_date)")
            .eq("user_id", session.user.id)
            .eq("admin_approved", true),
          supabase
            .from("attendance_requests")
            .select("request_date")
            .eq("enrollment_id", latestId)
            .eq("status", "APPROVED"),
        ]);

        const dates: AttendanceDate[] = [
          ...(adminRes.data || []).map(r => ({ date: r.session_date, source: "Admin" as const })),
          ...(pkgRes.data || []).flatMap(r => {
            const sessions = r.pkg_group_sessions as { session_date: string } | null;
            return sessions?.session_date ? [{ date: sessions.session_date, source: "Group" as const }] : [];
          }),
          ...(selfRes.data || []).map(r => ({ date: r.request_date, source: "Self" as const })),
        ].sort((a, b) => a.date.localeCompare(b.date));
        setAttendanceDates(dates);

        // Fetch group membership
        const { data: groupData } = await supabase
          .from("pkg_group_members")
          .select("group_id, pkg_groups(name)")
          .eq("user_id", session.user.id)
          .eq("member_status", "active")
          .limit(1);
        if (groupData && groupData.length > 0) {
          const grp = groupData[0].pkg_groups as { name: string } | null;
          setGroupName(grp?.name || null);
        }
            } else {
        setHasNoData(true);
      }

      // ── Upcoming sessions + Zoom URL (single source of truth — powers both
      // the top Next-Class summary and UpcomingSessionsCard, fetched once) ──
      const nextRes = await (supabase as any).rpc("get_student_upcoming_sessions", { p_user_id: session.user.id });
      if (!nextRes.error && Array.isArray(nextRes.data)) {
        setUpcomingSessions(nextRes.data as PrimarySession[]);
      }
      const zoomRes = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", "zoom_meeting_url")
        .maybeSingle();
      if (!zoomRes.error && zoomRes.data) setZoomUrl(((zoomRes.data as any).value as string) || null);

      setLoading(false);
      if (!isOnboardingDone()) setShowWelcome(true);
            } catch (err) {
        // Log the real error for debugging, but never surface it to students.
        console.error("[StudentDashboard] dashboard load failed:", err);
        setFetchError("error");
        setLoading(false);
      }
    };
    load();
  }, [navigate, gateLoading, resetBlocked, retryCount]);

  const handleItemCompleted = (key: string, _value: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, completed: true } : item))
    );
    if (key === "Full name") setUserName(_value);
  };

  // ── Hooks that must live before any early return ──────────────────────────
  const lessonsCompleted = Object.values(gamification.lessonProgress).filter((p) => p.chapter_completed).length;

  // Level-up: detect league change since last session. Surfaced as a toast
  // (gamification stays secondary) — never a fullscreen overlay.
  const levelUpChecked = useRef(false);
  useEffect(() => {
    if (loading || gamLoading || !hasNoData || levelUpChecked.current || !league) return;
    levelUpChecked.current = true;
    const prevLeague = sessionStorage.getItem("kl_last_league");
    if (prevLeague && prevLeague !== league.key) {
      uiToast({ title: t("dashboardPage.levelUp"), description: `${league.emoji ?? ""} ${leagueName(league, language)}`.trim(), duration: 4000 });
    }
    sessionStorage.setItem("kl_last_league", league.key);
  }, [league, loading, gamLoading, hasNoData, uiToast, t, language]);

  // ── Redesigned blocks: read-only derivations of existing rows ──────────
  const { c: dc } = useDashCopy();
  const learning = useDashboardLearning(userId);
  const todayKey = localDateKey();
  const xp = useMemo(() => xpStatus(gamification.totalXp), [gamification.totalXp]);
  const heroStreakState = getStreakState(gamification.streak.current_streak, gamification.streak.last_activity_date, todayKey);
  const missions = useMemo(
    () => (learning.data ? missionsFromActivity(learning.data.todayActivity, vocabClaimed) : null),
    [learning.data, vocabClaimed],
  );
  const nextLesson = useMemo(
    () => (learning.data ? pickContinueLesson(learning.data.lessons, learning.data.lessonProgress, profileLevel) : null),
    [learning.data, profileLevel],
  );
  const continueHref = nextLesson?.href ?? "/textbook";
  const journey = useMemo(() => journeyStops(profileLevel), [profileLevel]);
  // Cluby's egg — read from real progress only (null until the rows load).
  const egg = useMemo(
    () => (learning.data ? eggStatus(learning.data.lessonProgress, learning.data.badges, learning.data.todayActivity, learning.data.everClaimedWordOfDay) : null),
    [learning.data],
  );
  const clubyAwake = egg?.stage === 3;
  // Lets celebrations outside the dashboard (XpAnimation) show Cluby only after he hatched.
  useEffect(() => {
    if (egg) markClubyAwake(egg.stage === 3);
  }, [egg]);
  const [claimingWord, setClaimingWord] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    missions?.forEach(m => { if (m.done) markMissionCompletedOnce(m.id, todayKey); });
  }, [missions, todayKey]);

  const viewSent = useRef(false);
  useEffect(() => {
    if (viewSent.current || loading || gamLoading || !learning.data) return;
    viewSent.current = true;
    dashEvent({ name: "dashboard_view", enrolled: !hasNoData, level: profileLevel || null, xp_level: xp.levelNumber });
  }, [loading, gamLoading, learning.data, hasNoData, profileLevel, xp.levelNumber]);

  const practiceLinks = useMemo(() => [
    { label: t("dashboardPage.qaTextbook"), desc: t("dashboardPage.qaTextbookDesc"), icon: "open-book" as BrandIconName, path: "/textbook" },
    { label: t("dashboardPage.qaQuiz"), desc: t("dashboardPage.qaQuizDesc"), icon: "notebook" as BrandIconName, path: "/daily-quiz" },
    { label: t("dashboardPage.qaGames"), desc: t("dashboardPage.qaGamesDesc"), icon: "controller" as BrandIconName, path: "/games" },
    { label: t("dashboardPage.qaVocab"), desc: t("dashboardPage.qaVocabDesc"), icon: "flashcards" as BrandIconName, path: "/review" },
  ], [t]);
  // ─────────────────────────────────────────────────────────────────────────

  if (gateLoading || resetBlocked || loading) {
    // Skeleton mirrors the real hierarchy (hero → continue + missions →
    // journey) so nothing jumps when the data lands.
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 px-4" aria-busy="true">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
            <Skeleton className="h-52 rounded-3xl" />
            <div className="grid gap-4 lg:grid-cols-5">
              <Skeleton className="h-72 rounded-[20px] lg:col-span-3" />
              <Skeleton className="h-72 rounded-[20px] lg:col-span-2" />
            </div>
            <Skeleton className="h-36 rounded-[20px]" />
          </div>
        </main>
      </div>
    );
  }

    if (fetchError) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-foreground font-medium">{t("dashboardPage.errorHeading")}</p>
            <p className="text-sm text-muted-foreground">
              {t("dashboardPage.errorBody")}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => { setFetchError(null); setLoading(true); setRetryCount(c => c + 1); }}
                className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
              >
                {t("dashboardPage.tryAgain")}
              </button>
              <button
                onClick={() =>
                  trackAndOpenWhatsApp(
                    `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I'm having trouble loading my Klovers dashboard.")}`,
                    { cta_label: "dashboard_error_contact" }
                  )
                }
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
              >
                {t("dashboardPage.contactSupport")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const displayName = userName || t("dashboardPage.studentFallback");
  // Hero avatar signals profile completion: dark pink + pulsing until BOTH a
  // profile photo and a phone number exist, neon green once they do.
  const profileComplete = !!avatarUrl && !!profilePhone;
  const profileBadgeHint = profileComplete
    ? (language === "ar" ? "الملف الشخصي مكتمل" : "Profile complete")
    : !profilePhone && !avatarUrl
      ? (language === "ar" ? "أضف صورتك ورقم هاتفك" : "Add your photo and phone number")
      : !profilePhone
        ? (language === "ar" ? "أضف رقم هاتفك" : "Add your phone number")
        : (language === "ar" ? "أضف صورتك الشخصية" : "Add your profile photo");
  const handleProfileBadgeClick = () => {
    if (!profilePhone) {
      navigate("/complete-profile");
      return;
    }
    document.getElementById("profile-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const hasBlockers = checklistItems.some(
    (i) => !i.completed && (i.key === "Preferred class days" || i.key === "Korean level")
  );
  const journeyStage = enrollments.length > 0 ? 2 : 1;
  const planLabel = (plan: string) => {
    const p = (plan || "").toLowerCase();
    if (p === "group") return t("dashboardPage.planGroup");
    if (p === "private") return t("dashboardPage.planPrivate");
    return plan;
  };

  const dateLocale = language === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  const todayStr = new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" });

  const handleExportProgress = () => {
    const lines: string[] = [
      "KLOVERS KOREAN ACADEMY — STUDENT PROGRESS REPORT",
      "=".repeat(50),
      `Generated: ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      "",
      "STUDENT",
      `  Name:    ${userName || "—"}`,
      `  Level:   ${profileLevel || "—"}`,
      "",
      "LEARNING STATS",
      `  Total XP:        ${gamification.totalXp.toLocaleString()}`,
      `  Day Streak:      ${gamification.streak.current_streak} days`,
      `  Lessons Done:    ${lessonsCompleted} / 45`,
      `  League:          ${league ? `${league.emoji} ${league.name}` : "Beginner"}`,
      "",
      "ATTENDANCE",
      `  Sessions logged: ${attendanceDates.length}`,
      ...attendanceDates.map((d, i) => `  ${String(i + 1).padStart(3, " ")}. ${new Date(d.date + "T00:00:00").toLocaleDateString("en-GB")}  (${d.source})`),
      "",
      "PLACEMENT TEST",
      placementTest
        ? `  Score: ${placementTest.score}  |  Level: ${placementTest.level}  |  Date: ${new Date(placementTest.created_at).toLocaleDateString("en-GB")}`
        : "  No placement test on record",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `klovers-progress-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const firstName = displayName.split(" ")[0];
  const nextSession = upcomingSessions[0] ?? null;
  // Same conversion StudentPrimaryAction uses, so "today" means the same day in both.
  const classIsToday = !!nextSession && (() => {
    const tz = getUserTimezone();
    const local = convertDateTimeToTimezone(nextSession.session_date, nextSession.start_time, nextSession.timezone || "Africa/Cairo", tz);
    return studentCalendarDaysUntil(local.dateStr, tz) === 0;
  })();
  const pendingLatest = pendingEnrollments[pendingEnrollments.length - 1];

  const handleClaimWord = async () => {
    if (vocabClaimed || claimingWord) return;
    setClaimingWord(true);
    try {
      await awardGameXp("vocab_daily", 5, 1);
      localStorage.setItem(vocabStorageKey, "1");
      setVocabClaimed(true);
      learning.addTodayActivity(WORD_OF_DAY_ACTIVITY);
      markMissionCompletedOnce("word", todayKey);
      toast({ title: t("dashboardPage.xpBonus"), description: t("dashboardPage.vocabBonus") });
    } finally {
      setClaimingWord(false);
    }
  };

  const avatarSlot = profileComplete ? (
    <div
      className="h-11 w-11 rounded-full bg-live-bright text-foreground flex items-center justify-center font-display font-bold text-lg shrink-0 select-none ring-2 ring-foreground"
      title={profileBadgeHint}
      aria-label={profileBadgeHint}
      role="img"
    >
      {displayName?.[0]?.toUpperCase() ?? "K"}
    </div>
  ) : (
    <button
      type="button"
      onClick={handleProfileBadgeClick}
      title={profileBadgeHint}
      aria-label={profileBadgeHint}
      className="h-11 w-11 rounded-full bg-klovers-yellow text-charcoal flex items-center justify-center font-display font-bold text-lg shrink-0 select-none ring-2 ring-charcoal/20 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground"
    >
      {displayName?.[0]?.toUpperCase() ?? "K"}
    </button>
  );

  /* G. Upcoming class — real class data only (StudentPrimaryAction owns the
     Join / schedule / renewal states). Unenrolled students get the existing
     pending-review or start-your-journey card instead. */
  // A private student's lessons come from her roster row and bundle. An old
  // enrollments row (e.g. from the site's enrol flow) must not replace them
  // with a package count that is never deducted.
  const classBlock = isPrivate ? (
    <section aria-labelledby="dash-private-title" className="min-w-0 space-y-3">
      <h2 id="dash-private-title" className="sr-only">{dc("nextClassTitle")}</h2>
      <StudentSelfService userId={userId} />
    </section>
  ) : !hasNoData ? (
    <section aria-labelledby="dash-class-title" className="min-w-0 space-y-3"
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest("a[href^='http']");
        if (a) dashEvent({ name: "class_opened", source: "next_class" });
      }}>
      <h2 id="dash-class-title" className="sr-only">{dc("nextClassTitle")}</h2>
      <StudentPrimaryAction
        enrollments={enrollments}
        attendanceDates={attendanceDates}
        nextSession={nextSession}
        zoomUrl={zoomUrl}
        pendingEnrollments={pendingEnrollments}
        checklistItems={checklistItems}
      />
      <MyTrialClassCard />
    </section>
  ) : pendingLatest ? (() => {
    const pending = pendingLatest;
    const label =
      pending.approval_status === "PENDING_PAYMENT"
        ? t("dashboardPage.awaitingPayment")
        : pending.approval_status === "UNDER_REVIEW"
          ? t("dashboardPage.underReview")
          : t("dashboardPage.pendingLabel");
      return (
        <div className="space-y-6">
          <Card className="border-charcoal/20 bg-ivory dark:bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-charcoal dark:text-foreground" /> {t("dashboardPage.enrollmentPendingTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {tInterpolate(t("dashboardPage.enrollmentPendingBody1"), { plan: planLabel(pending.plan_type), status: label })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("dashboardPage.enrollmentPendingBody2")}
              </p>
            </CardContent>
          </Card>
        </div>
      );
  })() : (
    <div className="space-y-3">
      <Card className="border-charcoal/20 bg-ivory dark:bg-card ring-1 ring-charcoal/10">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="flex items-start gap-4">
            <BrandIcon name="open-book" className="h-12 w-12 sm:h-14 sm:w-14" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{t("dashboardPage.startJourneyTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("dashboardPage.startJourneyBody")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{/* 200+ = students Reham has taught herself (the one public figure on record). */}
            {tInterpolate(t("dashboardPage.joinStudents"), { count: 200 })}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            {[
              { icon: "teacher" as BrandIconName, text: t("dashboardPage.featureLiveClasses") },
              { icon: "progress" as BrandIconName, text: t("dashboardPage.featureProgress") },
              { icon: "trophy" as BrandIconName, text: t("dashboardPage.featureXp") },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2 border border-border">
                <BrandIcon name={icon} className="h-7 w-7" />
                <span className="text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => navigate("/enroll-now")} size="lg" className="flex-1">{t("dashboardPage.enrollNow")}</Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/free-trial")} className="flex-1">{t("dashboardPage.bookFreeTrial")}</Button>
          </div>
        </CardContent>
      </Card>
      <MyTrialClassCard />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">

          {/* A. Compact hero — status + ONE action */}
          <DashboardHero
            firstName={firstName}
            todayLabel={todayStr}
            xp={xp}
            streak={gamification.streak.current_streak}
            streakState={heroStreakState}
            continueHref={continueHref}
            continueBook={nextLesson?.lesson.book ?? null}
            continueLesson={nextLesson?.lesson.sort_order ?? null}
            hasStarted={!!nextLesson && (nextLesson.stepsDone > 0 || nextLesson.reason !== "start_at_level")}
            avatarSlot={avatarSlot}
            clubyAwake={clubyAwake}
          />

          {/* Cluby's clover egg: crack → glow → hatch from real learning. */}
          {egg && <EggStatusCard egg={egg} />}

          {/* KLOVERS World: the story as a place to walk into, near the top
              so it is seen on a phone without scrolling far. */}
          <WorldEntryCard isAr={language === "ar"} compact />

          {/* Account alerts (package running low / pending review) — compact */}
          {(() => {
            const alerts: React.ReactNode[] = [];
            if (enrollments.length > 0 && !isPrivate) {
              const remaining = enrollments[0].sessions_total - attendanceDates.length;
              if (remaining <= 2) {
                alerts.push(
                  <div key="sessions" className="flex items-center gap-2 bg-ivory dark:bg-card border border-charcoal/20 rounded-xl px-3 py-2 text-sm">
                    <KloverIcon name="calendar-check" className="h-6 w-6 shrink-0" />
                    <span className="flex-1 font-medium text-charcoal dark:text-foreground">{remaining <= 0 ? t("dashboardPage.packageFinished") : tInterpolate(t("dashboardPage.sessionsLeftAlert"), { count: remaining })}</span>
                    <Button size="sm" className="min-h-11 text-xs bg-klovers-yellow hover:bg-klovers-yellow/90 text-charcoal shrink-0 px-3" onClick={() => navigate("/enroll-now")}>{t("dashboardPage.renewArrow")}</Button>
                  </div>
                );
              }
            }
            pendingEnrollments.forEach(pe => {
              const label = pe.approval_status === "PENDING_PAYMENT" ? t("dashboardPage.awaitingPayment") : pe.approval_status === "UNDER_REVIEW" ? t("dashboardPage.underReview") : t("dashboardPage.pendingLabel");
              alerts.push(
                <div key={pe.id} className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-muted-foreground capitalize">{tInterpolate(t("dashboardPage.enrollmentStatusLine"), { plan: planLabel(pe.plan_type), status: label })}</span>
                </div>
              );
            });
            if (alerts.length === 0) return null;
            return <div className="space-y-1.5">{alerts}</div>;
          })()}

          {/* A class starting today outranks everything below the hero. */}
          {classIsToday && classBlock}

          {/* D + B. Primary row: continue learning + today's missions */}
          <div className="grid gap-4 lg:grid-cols-5 [&>*]:min-w-0">
            <div className="lg:col-span-3 flex">
              <div className="flex-1 flex flex-col [&>section]:flex-1">
                <ContinueLearningCard next={nextLesson} loading={learning.loading} error={learning.error} onRetry={learning.retry} />
              </div>
            </div>
            <div className="lg:col-span-2 flex">
              <div className="flex-1 flex flex-col [&>section]:flex-1">
                <TodaysMissions
                  missions={missions}
                  loading={learning.loading}
                  continueHref={continueHref}
                  claimLabel={t("dashboardPage.claimXp")}
                  claiming={claimingWord}
                  onClaimWord={handleClaimWord}
                  clubyAwake={clubyAwake}
                />
              </div>
            </div>
          </div>

          {/* C. Learning journey */}
          <LearningJourneyMap stops={journey.stops} currentIndex={journey.currentIndex} continueHref={continueHref} />

          {/* E | G + F. Collection & next unlock; beside it the upcoming class,
              then recent achievements (tertiary). Mobile order: E, G, F. */}
          <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
            <CollectionCard earned={learning.data?.badges ?? []} milestones={learning.data?.milestones ?? []} clubyAwake={clubyAwake} />
            <div className="space-y-4">
              {!classIsToday && classBlock}
              <RecentAchievements earned={learning.data?.badges ?? []} />
            </div>
          </div>

          {/* H. Secondary — account, classes, package */}
          <section aria-labelledby="dash-account-title" className="space-y-4 pt-4">
            <h2 id="dash-account-title" className="font-display text-base font-semibold text-foreground">{dc("accountTitle")}</h2>
            {!hasNoData ? (
              <>
                <RegistrationChecklist userId={userId} enrollmentId={latestEnrollmentId} items={checklistItems} onItemCompleted={handleItemCompleted} autoFocusField={autoFocusField} />
                <div id="profile-card">
                  <ProfileCard
                    userId={userId}
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    enrollmentCount={enrollments.length}
                    journeyStage={journeyStage}
                    onAvatarUploaded={(url) => setAvatarUrl(url)}
                    onNameUpdated={(name) => setUserName(name)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <KloverIcon name="growth-chart" className="h-7 w-7" /> {t("dashboardPage.koreanLevel")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profileLevel ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className="text-sm px-3 py-1">{getLevelShortLabel(profileLevel, language) || profileLevel}</Badge>
                            {/* No score out of anything: the old test scored out of 30 and the
                                merged one out of up to 62, so a fixed "/40" was wrong either
                                way. The date is what a student can act on — how stale it is. */}
                            {placementTest && (
                              <p className="text-xs text-muted-foreground mt-1">{tInterpolate(t("dashboardPage.tested"), { date: new Date(placementTest.created_at).toLocaleDateString(dateLocale) })}</p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" className="min-h-11" onClick={() => navigate("/placement-test")}>
                            <RotateCcw className="h-3.5 w-3.5 me-1.5" /> {t("dashboardPage.retake")}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{t("dashboardPage.takeTestPrompt")}</p>
                          <Button size="sm" className="min-h-11" onClick={() => navigate("/placement-test")}>
                            <GraduationCap className="h-3.5 w-3.5 me-1.5" /> {t("dashboardPage.takeTest")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Package summary card (most recent) */}
                  {enrollments[0] && !isPrivate && (() => {
                    const enrollment = enrollments[0];
                    const totalUsed = attendanceDates.length;
                    const remaining = enrollment.sessions_total - totalUsed;
                    const extra = remaining < 0 ? Math.abs(remaining) : 0;
                    const due = Math.round(extra * enrollment.unit_price);
                    const curr = enrollment.currency === "EGP" ? t("dashboardPage.currencyEgp") : t("dashboardPage.currencyUsd");
                    return (
                      <Card className={remaining <= 0 && totalUsed > 0 ? "border-klovers-green border-2" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-lg flex items-center gap-2 flex-wrap min-w-0">
                              <Package className="h-4 w-4 shrink-0" />
                              <span className="capitalize break-words">{planLabel(enrollment.plan_type)}</span> — {tPlural("dashboardPage.monthsPlural", enrollment.duration)}
                            </CardTitle>
                            <Badge variant={remaining >= 0 ? "default" : "destructive"} className="shrink-0">
                              {remaining >= 0 ? tInterpolate(t("dashboardPage.sessionsLeft"), { count: remaining }) : tInterpolate(t("dashboardPage.sessionsExtra"), { count: extra })}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: t("dashboardPage.pkgPackage"), val: enrollment.sessions_total, red: false },
                              { label: t("dashboardPage.pkgUsed"), val: totalUsed, red: false },
                              { label: remaining >= 0 ? t("dashboardPage.pkgRemaining") : t("dashboardPage.pkgExtraLabel"), val: remaining >= 0 ? remaining : extra, red: remaining < 0 },
                              { label: t("dashboardPage.pkgDue"), val: `${curr}${due.toLocaleString()}`, red: due > 0 },
                            ].map(({ label, val, red }) => (
                              <div key={label} className={`rounded-lg p-3 text-center border ${red ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border"}`}>
                                <span className="text-[10px] text-muted-foreground block">{label}</span>
                                <p className={`text-lg font-bold ${red ? "text-destructive" : "text-foreground"}`}>{val}</p>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{t("dashboardPage.sessionsUsed")}</span>
                              <span>{Math.min(totalUsed, enrollment.sessions_total)}/{enrollment.sessions_total}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? "bg-destructive" : remaining <= 2 ? "bg-klovers-yellow" : "bg-klovers-green"}`}
                                style={{ width: `${Math.min(100, (totalUsed / enrollment.sessions_total) * 100)}%` }}
                              />
                            </div>
                          </div>
                          {due > 0 && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>{tInterpolate(t("dashboardPage.extraDueNote"), { extra, amount: `${curr}${due.toLocaleString()}` })}</span>
                            </div>
                          )}
                          {groupName && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span>{t("dashboardPage.group")}: <strong className="text-foreground">{groupName}</strong></span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
                <UpcomingSessionsCard sessions={upcomingSessions} zoomUrl={zoomUrl} showJoinAction={false} />
                {!isPrivate && <StudentAttendanceRequest userId={userId} />}
                {/* Additional packages (if > 1) */}
                {!isPrivate && enrollments.slice(1).map((enrollment) => {
                  const totalUsed = enrollment.sessions_total - enrollment.sessions_remaining;
                  const remaining = enrollment.sessions_total - totalUsed;
                  const extra = remaining < 0 ? Math.abs(remaining) : 0;
                  const due = Math.round(extra * enrollment.unit_price);
                  const curr = enrollment.currency === "EGP" ? t("dashboardPage.currencyEgp") : t("dashboardPage.currencyUsd");
                  return (
                    <Card key={enrollment.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap min-w-0">
                            <Package className="h-4 w-4 shrink-0" />
                            <span className="capitalize break-words">{planLabel(enrollment.plan_type)}</span> — {tPlural("dashboardPage.monthsPlural", enrollment.duration)}
                            <Badge variant="outline" className="ms-1 text-xs shrink-0">{t("dashboardPage.older")}</Badge>
                          </CardTitle>
                          <Badge variant={remaining >= 0 ? "secondary" : "destructive"} className="shrink-0">
                            {remaining >= 0 ? tInterpolate(t("dashboardPage.sessionsLeft"), { count: remaining }) : tInterpolate(t("dashboardPage.sessionsExtra"), { count: extra })}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: t("dashboardPage.pkgPackage"), val: enrollment.sessions_total },
                            { label: t("dashboardPage.pkgUsed"), val: totalUsed },
                            { label: remaining >= 0 ? t("dashboardPage.pkgRemaining") : t("dashboardPage.pkgExtraLabel"), val: remaining >= 0 ? remaining : extra },
                            { label: t("dashboardPage.pkgDue"), val: `${curr}${due.toLocaleString()}` },
                          ].map(({ label, val }) => (
                            <div key={label} className="rounded-lg bg-muted/50 border border-border p-2 text-center">
                              <span className="text-[10px] text-muted-foreground block">{label}</span>
                              <p className="text-base font-bold text-foreground">{val}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {attendanceDates.length > 0 && <AttendanceHistoryCard dates={attendanceDates} />}
                {/* ── Progress Report + Certificate ── */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => window.open(`/progress-report?uid=${userId}`, '_blank', 'noopener,noreferrer')}
                    className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-charcoal/30 hover:bg-ivory dark:hover:bg-card transition-all text-center"
                  >
                    <KloverIcon name="growth-chart" className="h-10 w-10 sm:h-12 sm:w-12" />
                    <span className="text-sm font-semibold text-foreground">{t("dashboardPage.progressReport")}</span>
                    <span className="text-xs text-muted-foreground">{t("dashboardPage.downloadPdf")}</span>
                  </button>
                  <button
                    onClick={() => window.open(`/certificate?uid=${userId}&level=${encodeURIComponent(profileLevel || 'A0')}`, '_blank', 'noopener,noreferrer')}
                    className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-charcoal/30 hover:bg-ivory dark:hover:bg-card transition-all text-center"
                  >
                    <KloverIcon name="badge-blossom" className="h-10 w-10 sm:h-12 sm:w-12" />
                    <span className="text-sm font-semibold text-foreground">{t("dashboardPage.certificate")}</span>
                    <span className="text-xs text-muted-foreground">{t("dashboardPage.downloadPng")}</span>
                  </button>
                </div>
              </>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <KloverIcon name="growth-chart" className="h-7 w-7" /> {t("dashboardPage.koreanLevel")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileLevel ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="text-sm px-3 py-1">{getLevelShortLabel(profileLevel, language) || profileLevel}</Badge>
                        {/* No score out of anything: the old test scored out of 30 and the
                            merged one out of up to 62, so a fixed "/40" was wrong either
                            way. The date is what a student can act on — how stale it is. */}
                        {placementTest && (
                          <p className="text-xs text-muted-foreground mt-1">{tInterpolate(t("dashboardPage.tested"), { date: new Date(placementTest.created_at).toLocaleDateString(dateLocale) })}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="min-h-11" onClick={() => navigate("/placement-test")}>
                        <RotateCcw className="h-3.5 w-3.5 me-1.5" /> {t("dashboardPage.retake")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{t("dashboardPage.findLevel")}</p>
                      <Button size="sm" className="min-h-11" onClick={() => navigate("/placement-test")}>
                        <GraduationCap className="h-3.5 w-3.5 me-1.5" /> {t("dashboardPage.takeTest")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* H. More practice — tertiary */}
          <section aria-labelledby="practice-extras-heading" className="space-y-4 pt-2">
            <h2 id="practice-extras-heading" className="font-display text-base font-semibold text-foreground">{dc("morePractice")}</h2>
            <Suspense fallback={<div className="h-20 bg-muted/40 rounded-xl animate-pulse" />}>
              <DailyBonusCard />
            </Suspense>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {practiceLinks.map(({ label, desc, icon, path }) => (
                <button key={path} onClick={() => navigate(path)} aria-label={`${label}: ${desc}`}
                  className="min-w-0 min-h-11 rounded-xl border border-foreground/10 bg-card p-3 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
                  <BrandIcon name={icon} className="h-9 w-9 mb-1" />
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </button>
              ))}
            </div>
            {/* ── Discover Korea Gallery ── */}
            {(() => {
              const SCENES = [
                { img: imgJeju,        ko: "제주도",   en: "Jeju Island",       caption: "Volcanic paradise",    arName: "جزيرة جيجو",      arCaption: "جنة بركانية" },
                { img: imgBBQ,         ko: "삼겹살",   en: "Korean BBQ",         caption: "Grilled pork belly",   arName: "الشواء الكوري",   arCaption: "لحم مشوي على الطريقة الكورية" },
                { img: imgTemple,      ko: "사찰",     en: "Buddhist Temple",    caption: "Mountain temples",     arName: "معبد بوذي",       arCaption: "معابد بين الجبال" },
                { img: imgHanbok,      ko: "한복",     en: "Traditional Hanbok", caption: "Centuries of fashion", arName: "الهانبوك التقليدي", arCaption: "أزياء عمرها قرون" },
                { img: imgKpop,        ko: "케이팝",   en: "K-Pop Concert",      caption: "Global music wave",    arName: "حفلة كيبوب",      arCaption: "موجة موسيقية عالمية" },
                { img: imgNightMarket, ko: "야시장",   en: "Night Market",       caption: "Street food & vibes",  arName: "السوق الليلي",    arCaption: "أكل الشارع وأجواء مميزة" },
                { img: imgTea,         ko: "차 문화",  en: "Tea Culture",        caption: "Calm & tradition",     arName: "ثقافة الشاي",     arCaption: "هدوء وتقاليد" },
                { img: imgMarket,      ko: "전통시장", en: "Traditional Market", caption: "Colors & local life",  arName: "السوق التقليدي",  arCaption: "ألوان وحياة محلية" },
              ].map(({ en, caption, arName, arCaption, ...rest }) =>
                language === "ar" ? { ...rest, en: arName, caption: arCaption } : { ...rest, en, caption }
              );
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboardPage.discoverKorea")}</h2>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground" tabIndex={0} role="region" aria-label={t("dashboardPage.discoverKorea")}>
                    {SCENES.map(({ img, ko, en, caption }) => (
                      <div key={ko} className="relative flex-none w-36 h-44 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
                        <img src={img} alt={`${en} (${ko})`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-white font-bold text-base leading-tight" lang="ko">{ko}</p>
                          <p className="text-white/75 text-[10px] leading-tight">{en}</p>
                          <p className="text-white/50 text-[9px] mt-0.5">{caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* ── Refer a Friend — slim strip ── */}
            {userId && (() => {
              const refLink = `https://kloversegy.com/free-trial?ref=${userId}`;
              return (
                <div className="flex flex-wrap items-center gap-3 bg-ivory dark:bg-card border border-charcoal/20 rounded-xl px-4 py-2.5">
                  <KloverIcon name="student-girl-heart" className="h-8 w-8 sm:h-9 sm:w-9" />
                  <span className="flex-1 text-sm text-muted-foreground min-w-0 break-words">
                    <strong className="text-foreground">{t("dashboardPage.referTitle")}</strong> · {t("dashboardPage.referEarn")}
                    {referralCount > 0 && <> · <span className="text-charcoal dark:text-foreground font-medium">{tInterpolate(t("dashboardPage.referJoined"), { count: referralCount })}</span></>}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast({ title: t("dashboardPage.linkCopied") }); }}
                    className="shrink-0 gap-1 border-charcoal/30 text-charcoal dark:text-foreground hover:bg-klovers-yellow/40 min-h-11 text-xs px-3">
                    <Copy className="h-3 w-3" /> {t("dashboardPage.copyLink")}
                  </Button>
                </div>
              );
            })()}
          </section>

          {/* H. Learning insights — collapsed; its charts only load when opened */}
          <details
            className="group rounded-[20px] border border-foreground/10 bg-card"
            onToggle={(e) => setInsightsOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-display text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded-[20px]">
              {dc("insightsTitle")}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            {insightsOpen && (
              <div className="space-y-4 px-5 pb-5">
                {(() => {
                  const WEEKLY_GOAL = 300;
                  const pct = Math.min(100, Math.round((weeklyXp / WEEKLY_GOAL) * 100));
                  const msg = pct >= 100 ? t("dashboardPage.goalCrushed") : pct >= 60 ? t("dashboardPage.almostThere") : pct >= 30 ? t("dashboardPage.goodStart") : t("dashboardPage.startEarning");
                  return (
                    <div className="flex-1 bg-card border border-border/60 rounded-2xl px-4 py-4 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">{t("dashboardPage.weeklyXp")}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-xs">{weeklyXp}/{WEEKLY_GOAL}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pct >= 100 ? "bg-klovers-green text-charcoal" : "bg-primary text-foreground"}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{msg}</p>
                    </div>
                  );
                })()}
                <Suspense fallback={<Skeleton className="h-24 rounded-xl" />}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <AchievementMilestoneCard />
                    <LearningGoalsCard />
                  </div>
                  {!hasNoData && (
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-3">{t("dashboardPage.yourAnalytics")}</h3>
                      <AnalyticsSection />
                    </div>
                  )}
                  <StreakCalendar />
                  <LeaderboardCard />
                </Suspense>
                <Button variant="outline" size="sm" onClick={handleExportProgress} aria-label={t("dashboardPage.exportAria")} className="min-h-11 gap-1.5">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> {dc("exportProgress")}
                </Button>
              </div>
            )}
          </details>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;

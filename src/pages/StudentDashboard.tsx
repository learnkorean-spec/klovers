import React, { lazy, Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetGate } from "@/hooks/useResetGate";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyStepper from "@/components/JourneyStepper";
import StudentGroupAttendance from "@/components/StudentGroupAttendance";
import UpcomingSessionsCard from "@/components/UpcomingSessionsCard";
import StudentAttendanceRequest from "@/components/StudentAttendanceRequest";
import AvatarUpload from "@/components/AvatarUpload";
import RegistrationChecklist from "@/components/RegistrationChecklist";
import { LeagueProgressBar, BadgeGrid } from "@/components/GamificationUI";
import { LeaguePromotionModal, BadgeUnlockToast, StreakCelebration } from "@/components/XpAnimation";
import { useGamification } from "@/hooks/useGamification";
import { BADGES } from "@/constants/gamification";
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
import { AlertCircle, CheckCircle2, AlertTriangle, Package, CalendarCheck, Users, CreditCard, BookOpen, GraduationCap, RotateCcw, ChevronDown, Gamepad2, Trophy, Zap, Pencil, Check, X, FlameIcon, Download, Copy, Gift, FileText, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast, useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLevelByKey } from "@/constants/levels";
import WelcomeModal, { isOnboardingDone } from "@/components/WelcomeModal";
import { useCountUp } from "@/hooks/useCountUp";

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
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Attendance History ({dates.length} sessions)
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-1">
              {dates.map((d, i) => (
                <div key={`${d.date}-${i}`} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
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
      toast({ title: "Error", description: "Could not update name.", variant: "destructive" });
      return;
    }
    toast({ title: "Name updated!" });
    onNameUpdated(nameValue.trim());
    setEditingName(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <AvatarUpload userId={userId} currentUrl={avatarUrl} name={displayName} onUploaded={onAvatarUploaded} />
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-[180px] text-sm"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveName} disabled={saving}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingName(false); setNameValue(displayName); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-lg">{displayName}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNameValue(displayName); setEditingName(true); }}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{enrollmentCount} active package{enrollmentCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <JourneyStepper currentStage={journeyStage} />
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  useSEO({ title: "My Dashboard", description: "Track your Korean learning progress, schedule, and achievements on Klovers.", canonical: "https://kloversegy.com/dashboard" });
  const { loading: gateLoading, resetBlocked } = useResetGate();
  const { progress: gamification, league, loading: gamLoading, awardGameXp, leaguePromotion, newBadges, streakCelebration, clearLeaguePromotion, clearNewBadges, clearStreakCelebration } = useGamification();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [profileLevel, setProfileLevel] = useState("");
  const [placementTest, setPlacementTest] = useState<PlacementTestResult | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [latestEnrollmentId, setLatestEnrollmentId] = useState("");
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const vocabStorageKey = `vocab_xp_${new Date().toISOString().split("T")[0]}`;
  const [vocabClaimed, setVocabClaimed] = useState(() => !!localStorage.getItem(`vocab_xp_${new Date().toISOString().split("T")[0]}`));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast: uiToast } = useToast();

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          uiToast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

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
        .select("avatar_url, name, level, country")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
        setUserName(profile.name || "");
        setProfileLevel(profile.level || "");
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

        const effectiveLevel = autoUpdates.level || p?.level || "";
        const effectiveName = autoUpdates.name || p?.name || "";

        const items: ChecklistItem[] = [
          { key: "Full name", label: "Full name", completed: !!(effectiveName && effectiveName.trim() !== "") },
          { key: "Korean level", label: "Korean level", completed: !!(effectiveLevel && effectiveLevel.trim() !== "") },
          { key: "Country", label: "Country", completed: !!(p?.country && p.country.trim() !== "") },
          { key: "Preferred class days", label: "Preferred class days", completed: !!(latestEnroll.preferred_days && latestEnroll.preferred_days.length > 0) },
          { key: "Timezone", label: "Timezone", completed: !!(latestEnroll.timezone && latestEnroll.timezone.trim() !== "") },
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

      setLoading(false);
      if (!isOnboardingDone()) setShowWelcome(true);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load your dashboard. Please refresh.");
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

  // Level-up flash: detect league change since last session
  const [showLevelUpFlash, setShowLevelUpFlash] = useState(false);
  const levelUpChecked = useRef(false);
  useEffect(() => {
    if (levelUpChecked.current || !league) return;
    levelUpChecked.current = true;
    const prevLeague = sessionStorage.getItem("kl_last_league");
    if (prevLeague && prevLeague !== league.key) {
      setShowLevelUpFlash(true);
      setTimeout(() => setShowLevelUpFlash(false), 2200);
    }
    sessionStorage.setItem("kl_last_league", league.key);
  }, [league]);

  // Animated count-up for numeric stats
  const xpCountUp = useCountUp(gamification.totalXp, 1200);
  const streakCountUp = useCountUp(gamification.streak.current_streak, 800);

  const quickStats = useMemo(() => [
    { label: "Total XP", rawValue: gamification.totalXp, sub: weeklyXp > 0 ? `+${weeklyXp} this week` : undefined, icon: Zap, color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30" },
    { label: "Day Streak", rawValue: gamification.streak.current_streak, sub: `Best: ${gamification.streak.longest_streak}d`, icon: FlameIcon, color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30" },
    { label: "Lessons Done", rawValue: lessonsCompleted, icon: BookOpen, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
    { label: "League", rawValue: -1, icon: Trophy, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
  ], [gamification.totalXp, gamification.streak.current_streak, gamification.streak.longest_streak, lessonsCompleted, league, weeklyXp]);

  const quickActions = useMemo(() => [
    { label: "Textbook", desc: "Continue lessons", emoji: "📚", path: "/textbook", color: "hover:border-blue-400/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30" },
    { label: "Daily Quiz", desc: "+30 XP reward", emoji: "⚡", path: "/daily-quiz", color: "hover:border-yellow-400/60 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/30" },
    { label: "Games", desc: "20 fun games", emoji: "🎮", path: "/games", color: "hover:border-green-400/60 hover:bg-green-50/50 dark:hover:bg-green-950/30" },
    { label: "Vocab Review", desc: "Spaced repetition", emoji: "🧠", path: "/review", color: "hover:border-purple-400/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/30" },
  ], []);
  // ─────────────────────────────────────────────────────────────────────────

  if (gateLoading || resetBlocked || loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <main id="main-content" className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-16 rounded-xl" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
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
          <div className="text-center space-y-3 max-w-sm">
            <p className="text-destructive font-medium">Failed to load dashboard</p>
            <p className="text-muted-foreground text-sm">{fetchError}</p>
            <button
              onClick={() => { setFetchError(null); setLoading(true); setRetryCount(c => c + 1); }}
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const displayName = userName || "Student";
  const hasBlockers = checklistItems.some(
    (i) => !i.completed && (i.key === "Preferred class days" || i.key === "Korean level")
  );
  const journeyStage = enrollments.length > 0 ? 2 : 1;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const todayStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const lessonsCompleted = Object.values(gamification.lessonProgress).filter((p) => p.chapter_completed).length;

  // Level-up flash: detect league change since last session
  const [showLevelUpFlash, setShowLevelUpFlash] = useState(false);
  const levelUpChecked = useRef(false);
  useEffect(() => {
    if (levelUpChecked.current || !league) return;
    levelUpChecked.current = true;
    const prevLeague = sessionStorage.getItem("kl_last_league");
    if (prevLeague && prevLeague !== league.key) {
      setShowLevelUpFlash(true);
      setTimeout(() => setShowLevelUpFlash(false), 2200);
    }
    sessionStorage.setItem("kl_last_league", league.key);
  }, [league]);

  // Animated count-up for numeric stats
  const xpCountUp = useCountUp(gamification.totalXp, 1200);
  const streakCountUp = useCountUp(gamification.streak.current_streak, 800);

  const quickStats = useMemo(() => [
    { label: "Total XP", rawValue: gamification.totalXp, icon: Zap, color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30" },
    { label: "Day Streak", rawValue: gamification.streak.current_streak, sub: `Best: ${gamification.streak.longest_streak}d`, icon: FlameIcon, color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30" },
    { label: "Lessons Done", rawValue: lessonsCompleted, icon: BookOpen, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
    { label: "League", rawValue: -1, icon: Trophy, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
  ], [gamification.totalXp, gamification.streak.current_streak, gamification.streak.longest_streak, lessonsCompleted, league]);

  const quickActions = useMemo(() => [
    { label: "Textbook", desc: "Continue lessons", emoji: "📚", path: "/textbook", color: "hover:border-blue-400/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30" },
    { label: "Daily Quiz", desc: "+30 XP reward", emoji: "⚡", path: "/daily-quiz", color: "hover:border-yellow-400/60 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/30" },
    { label: "Games", desc: "20 fun games", emoji: "🎮", path: "/games", color: "hover:border-green-400/60 hover:bg-green-50/50 dark:hover:bg-green-950/30" },
    { label: "Vocab Review", desc: "Spaced repetition", emoji: "🧠", path: "/review", color: "hover:border-purple-400/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/30" },
  ], []);

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

  return (
    <div className="min-h-screen bg-muted/20">
      {showLevelUpFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-level-up-flash flex items-center justify-center bg-primary/30">
          <div className="animate-scale-in text-center">
            <p className="text-5xl mb-2">{league?.emoji}</p>
            <p className="text-2xl font-black text-foreground text-outlined-lg">Level Up!</p>
            <p className="text-lg font-bold text-foreground">{league?.name}</p>
          </div>
        </div>
      )}
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header row */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl px-5 py-4 border border-primary/10">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0 select-none">
              {displayName?.[0]?.toUpperCase() ?? "K"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">{todayStr}</p>
              <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">{greeting}, {displayName.split(" ")[0]} 👋</h1>
            </div>
            {league && (
              <div className="hidden sm:flex items-center gap-1.5 bg-background rounded-xl px-3 py-1.5 border border-border text-sm font-semibold shrink-0">
                <span>{league.emoji}</span>
                <span className="text-foreground">{league.name}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleExportProgress} className="gap-1.5 shrink-0">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Progress</span>
            </Button>
          </div>

          {/* ── Streak at-risk banner ── */}
          {(() => {
            const streak = gamification.streak.current_streak;
            if (streak < 1) return null;
            const today = new Date().toISOString().slice(0, 10);
            const lastActive = gamification.streak.last_activity_date?.slice(0, 10);
            if (lastActive === today) return null;
            return (
              <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 text-sm">
                <span className="text-2xl animate-bounce">🔥</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-orange-800 dark:text-orange-300">Keep your {streak}-day streak alive!</p>
                  <p className="text-orange-700 dark:text-orange-400 text-xs">Play a game or complete a lesson today before midnight.</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30" onClick={() => navigate("/games")}>
                  Play now
                </Button>
              </div>
            );
          })()}

          {/* ── Sessions running low banner ── */}
          {(() => {
            if (enrollments.length === 0) return null;
            const latest = enrollments[0];
            const remaining = latest.sessions_total - attendanceDates.length;
            if (remaining > 2) return null;
            return (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
                <span className="text-2xl">📦</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-blue-900">
                    {remaining <= 0 ? "Your package is finished!" : `Only ${remaining} session${remaining === 1 ? "" : "s"} left!`}
                  </p>
                  <p className="text-blue-700 text-xs">Renew now to keep your momentum going.</p>
                </div>
                <Button size="sm" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/enroll-now")}>
                  Renew
                </Button>
              </div>
            );
          })()}

          {/* ── Quick Stats (always visible) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickStats.map(({ label, rawValue, sub, icon: Icon, color }, idx) => {
              let displayValue: string;
              if (label === "Total XP") displayValue = xpCountUp.toLocaleString();
              else if (label === "Day Streak") displayValue = `${streakCountUp}d`;
              else if (label === "Lessons Done") displayValue = `${rawValue}/45`;
              else displayValue = league?.emoji ? `${league.emoji} ${league.name}` : "Beginner";
              return (
                <Card
                  key={label}
                  className="border-border hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-bold text-foreground text-sm leading-tight truncate">{displayValue}</p>
                        {sub && <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Daily Bonus (always visible, dismisses when claimed) ── */}
          <Suspense fallback={<div className="h-24 bg-muted/30 rounded-2xl animate-pulse" />}>
            <DailyBonusCard />
          </Suspense>

          {/* ── Quick Actions (always visible) ── */}
          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">What to do today</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map(({ label, desc, emoji, path, color }, idx) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  aria-label={`${label}: ${desc}`}
                  className={`group rounded-2xl border border-border bg-card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all ${color} animate-fade-up`}
                  style={{ animationDelay: `${180 + idx * 60}ms` }}
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Weekly XP goal bar + Book a class ── */}
          {(() => {
            const WEEKLY_GOAL = 300;
            const pct = Math.min(100, Math.round((weeklyXp / WEEKLY_GOAL) * 100));
            const msg = pct >= 100 ? "🎉 Weekly goal crushed!" : pct >= 60 ? "Almost there — keep going!" : pct >= 30 ? "Good start — keep it up!" : "Start earning XP today!";
            return (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-2xl px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">Weekly XP Goal</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{weeklyXp} / {WEEKLY_GOAL} XP</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-primary/10 text-primary"}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 animate-bar-grow"
                      style={{ "--bar-target": `${pct}%` } as React.CSSProperties}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{msg}</p>
                </div>
                <a
                  href={`https://wa.me/601121777560?text=${encodeURIComponent("Hi! I'd like to book my next Korean class.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-2xl px-5 py-4 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-semibold text-sm leading-tight">Book a Class</p>
                    <p className="text-white/80 text-xs">Message us on WhatsApp</p>
                  </div>
                </a>
              </div>
            );
          })()}

          {/* ── Vocabulary of the Day ── */}
          {(() => {
            const VOCAB = [
              { ko: "안녕하세요", rom: "annyeonghaseyo", en: "Hello / Good day", emoji: "👋" },
              { ko: "감사합니다", rom: "gamsahamnida", en: "Thank you", emoji: "🙏" },
              { ko: "사랑해요", rom: "saranghaeyo", en: "I love you", emoji: "❤️" },
              { ko: "공부하다", rom: "gongbuhada", en: "To study", emoji: "📚" },
              { ko: "맛있어요", rom: "massisseoyo", en: "It's delicious", emoji: "😋" },
              { ko: "화이팅", rom: "hwaiting", en: "Fighting! / You can do it!", emoji: "💪" },
              { ko: "천천히", rom: "cheoncheonhi", en: "Slowly", emoji: "🐢" },
            ];
            const today = VOCAB[new Date().getDay() % VOCAB.length];
            const handleVocabClaim = async () => {
              if (vocabClaimed) return;
              await awardGameXp("vocab_daily", 5, 1);
              localStorage.setItem(vocabStorageKey, "1");
              setVocabClaimed(true);
              toast({ title: "+5 XP", description: "Vocabulary bonus earned!" });
            };
            return (
              <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4">
                <div className="text-3xl">{today.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Word of the day</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight">{today.ko}</p>
                  <p className="text-sm text-muted-foreground">{today.rom} · {today.en}</p>
                </div>
                <Button size="sm" variant={vocabClaimed ? "ghost" : "default"} disabled={vocabClaimed} onClick={handleVocabClaim} className="shrink-0">
                  {vocabClaimed ? "✓ +5 XP" : "Claim +5 XP"}
                </Button>
              </div>
            );
          })()}

          {/* ── Refer a Friend ── */}
          {userId && (() => {
            const refLink = `https://kloversegy.com/free-trial?ref=${userId}`;
            const copyRef = () => {
              navigator.clipboard.writeText(refLink);
              toast({ title: "Link copied! 🎁", description: "Share it — you'll earn 1 free session when they enroll." });
            };
            return (
              <div className="flex items-center gap-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Refer a Friend → Earn 150 XP</p>
                  <p className="text-xs text-muted-foreground truncate">{refLink}</p>
                  {referralCount > 0 && (
                    <p className="text-xs text-violet-600 font-medium mt-0.5">
                      🎁 {referralCount} friend{referralCount !== 1 ? "s" : ""} joined · +{referralCount * 150} XP earned
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={copyRef} className="shrink-0 gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-100">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            );
          })()}

          {/* ── Profile completion bar (only for enrolled users with incomplete items) ── */}
          {checklistItems.length > 0 && (() => {
            const done = checklistItems.filter(i => i.completed).length;
            const total = checklistItems.length;
            if (done === total) return null;
            const pct = Math.round((done / total) * 100);
            return (
              <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
                <div className="relative w-10 h-10 shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#fde68a" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#f59e0b" strokeWidth="3"
                      strokeDasharray={`${(pct / 100) * 94.2} 94.2`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-700">{pct}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Complete your registration ({done}/{total} items)</p>
                  <p className="text-amber-700 dark:text-amber-400 text-xs">{total - done} item{total - done !== 1 ? "s" : ""} missing — finish setup to get placed in a class</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={() => navigate("/dashboard?complete=name")}>
                  Complete
                </Button>
              </div>
            );
          })()}

          {hasNoData ? (
            /* ── No-enrollment state: show learning features + enroll CTA ── */
            <div className="space-y-6">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Start Your Korean Journey</h2>
                      <p className="text-sm text-muted-foreground mt-1">Join live classes with expert teachers, track your progress, and connect with other K-drama fans learning Korean.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex -space-x-1">
                      {["🇪🇬","🇸🇦","🇦🇪","🇯🇴"].map((flag, i) => (
                        <span key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm">{flag}</span>
                      ))}
                    </div>
                    <span>Join <strong className="text-foreground">1,000+</strong> students from Egypt &amp; the Arab world</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    {[
                      { emoji: "🎓", text: "Live group & private classes" },
                      { emoji: "📊", text: "Progress tracking & analytics" },
                      { emoji: "🏆", text: "XP, badges & leaderboards" },
                    ].map(({ emoji, text }) => (
                      <div key={text} className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2 border border-border">
                        <span>{emoji}</span>
                        <span className="text-muted-foreground">{text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => navigate("/enroll-now")} size="lg" className="flex-1">Enroll Now</Button>
                    <Button variant="outline" size="lg" onClick={() => navigate("/free-trial")} className="flex-1">Book a Free Trial</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Still show level test for unenrolled */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> Korean Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileLevel ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="text-sm px-3 py-1">{getLevelByKey(profileLevel)?.shortLabel || profileLevel}</Badge>
                        {placementTest && (
                          <p className="text-xs text-muted-foreground mt-1">Score: {placementTest.score}/40 — {new Date(placementTest.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Find your Korean level</p>
                      <Button size="sm" onClick={() => navigate("/placement-test")}>
                        <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Take Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Still show gamification for unenrolled learners */}
              <Suspense fallback={<div className="h-40 bg-muted/30 rounded-2xl animate-pulse" />}>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5" /> My League</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LeagueProgressBar totalXp={gamification.totalXp} />
                    {gamLoading ? (
                      <BadgeGrid earnedBadges={[]} loading />
                    ) : gamification.badges.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Earned Badges ({gamification.badges.length})</p>
                        <BadgeGrid earnedBadges={gamification.badges} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Complete lessons and games to earn badges.</p>
                    )}
                  </CardContent>
                </Card>
                <AchievementMilestoneCard />
              </div>
              <StreakCalendar />
              <LeaderboardCard />
              </Suspense>
            </div>
          ) : (
            <>
              {/* ── Two-column layout: Profile + League ── */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Profile Card */}
                <ProfileCard
                  userId={userId}
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  enrollmentCount={enrollments.length}
                  journeyStage={journeyStage}
                  onAvatarUploaded={(url) => setAvatarUrl(url)}
                  onNameUpdated={(name) => setUserName(name)}
                />

                {/* League & XP */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5" /> My League
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LeagueProgressBar totalXp={gamification.totalXp} />
                    {gamLoading ? (
                      <BadgeGrid earnedBadges={[]} loading />
                    ) : gamification.badges.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Earned Badges ({gamification.badges.length})</p>
                        <BadgeGrid earnedBadges={gamification.badges} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Complete lessons and games to earn badges.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Korean Level + Registration Checklist (two-col) ── */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" /> Korean Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profileLevel ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className="text-sm px-3 py-1">{getLevelByKey(profileLevel)?.shortLabel || profileLevel}</Badge>
                          {placementTest && (
                            <p className="text-xs text-muted-foreground mt-1">Score: {placementTest.score}/40 — {new Date(placementTest.created_at).toLocaleDateString()}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Take the placement test to find your level</p>
                        <Button size="sm" onClick={() => navigate("/placement-test")}>
                          <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Take Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Package summary card (most recent) */}
                {enrollments[0] && (() => {
                  const enrollment = enrollments[0];
                  const totalUsed = attendanceDates.length;
                  const remaining = enrollment.sessions_total - totalUsed;
                  const extra = remaining < 0 ? Math.abs(remaining) : 0;
                  const due = Math.round(extra * enrollment.unit_price);
                  const curr = enrollment.currency === "EGP" ? "LE" : "$";
                  return (
                    <Card className={remaining <= 0 && totalUsed > 0 ? "border-green-500 border-2" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="capitalize">{enrollment.plan_type}</span> — {enrollment.duration}mo
                          </CardTitle>
                          <Badge variant={remaining >= 0 ? "default" : "destructive"}>
                            {remaining >= 0 ? `${remaining} left` : `${extra} extra`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: "Package", val: enrollment.sessions_total, red: false },
                            { label: "Used", val: totalUsed, red: false },
                            { label: remaining >= 0 ? "Remaining" : "Extra", val: remaining >= 0 ? remaining : extra, red: remaining < 0 },
                            { label: "Due", val: `${curr}${due.toLocaleString()}`, red: due > 0 },
                          ].map(({ label, val, red }) => (
                            <div key={label} className={`rounded-lg p-3 text-center border ${red ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border"}`}>
                              <span className="text-[10px] text-muted-foreground block">{label}</span>
                              <p className={`text-lg font-bold ${red ? "text-destructive" : "text-foreground"}`}>{val}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Sessions used</span>
                            <span>{Math.min(totalUsed, enrollment.sessions_total)}/{enrollment.sessions_total}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? "bg-destructive" : remaining <= 2 ? "bg-amber-500" : "bg-primary"}`}
                              style={{ width: `${Math.min(100, (totalUsed / enrollment.sessions_total) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {due > 0 && (
                          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span><strong>{extra}</strong> extra sessions — Due: <strong>{curr}{due.toLocaleString()}</strong></span>
                          </div>
                        )}
                        {groupName && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>Group: <strong className="text-foreground">{groupName}</strong></span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* ── Registration Checklist ── */}
              <RegistrationChecklist userId={userId} enrollmentId={latestEnrollmentId} items={checklistItems} onItemCompleted={handleItemCompleted} autoFocusField={autoFocusField} />

              {/* ── Achievements + Goals (two-col) ── */}
              <div className="grid md:grid-cols-2 gap-4">
                <AchievementMilestoneCard />
                <LearningGoalsCard />
              </div>

              {/* ── Analytics (full width) ── */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Your Learning Analytics</h3>
                <AnalyticsSection />
              </div>

              {/* ── Streak Calendar (full width) ── */}
              <StreakCalendar />

              {/* ── Leaderboard (full width) ── */}
              <LeaderboardCard />

              {/* ── Attendance & Admin (bottom section) ── */}
              <StudentAttendanceRequest userId={userId} />

              {/* Additional packages (if > 1) */}
              {enrollments.slice(1).map((enrollment) => {
                const totalUsed = enrollment.sessions_total - enrollment.sessions_remaining;
                const remaining = enrollment.sessions_total - totalUsed;
                const extra = remaining < 0 ? Math.abs(remaining) : 0;
                const due = Math.round(extra * enrollment.unit_price);
                const curr = enrollment.currency === "EGP" ? "LE" : "$";
                return (
                  <Card key={enrollment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="capitalize">{enrollment.plan_type}</span> — {enrollment.duration}mo
                          <Badge variant="outline" className="ml-1 text-xs">Older</Badge>
                        </CardTitle>
                        <Badge variant={remaining >= 0 ? "secondary" : "destructive"}>
                          {remaining >= 0 ? `${remaining} left` : `${extra} extra`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "Package", val: enrollment.sessions_total },
                          { label: "Used", val: totalUsed },
                          { label: remaining >= 0 ? "Remaining" : "Extra", val: remaining >= 0 ? remaining : extra },
                          { label: "Due", val: `${curr}${due.toLocaleString()}` },
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
              <UpcomingSessionsCard />
              <StudentGroupAttendance />

              {/* ── Progress Report + Certificate ── */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.open(`/progress-report?uid=${userId}`, '_blank')}
                  className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Progress Report</span>
                  <span className="text-xs text-muted-foreground">Download PDF</span>
                </button>
                <button
                  onClick={() => window.open(`/certificate?uid=${userId}&level=${encodeURIComponent(profileLevel || 'A0')}`, '_blank')}
                  className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Certificate</span>
                  <span className="text-xs text-muted-foreground">Download PNG</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      {streakCelebration !== null && <StreakCelebration currentStreak={streakCelebration} onContinue={clearStreakCelebration} />}
      {leaguePromotion && (
        <LeaguePromotionModal
          fromLeague={leaguePromotion.fromLeague}
          toLeague={leaguePromotion.toLeague}
          onClose={clearLeaguePromotion}
        />
      )}
    </div>
  );
};

export default StudentDashboard;

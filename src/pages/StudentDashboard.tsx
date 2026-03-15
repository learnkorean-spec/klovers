import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetGate } from "@/hooks/useResetGate";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyStepper from "@/components/JourneyStepper";
import StudentGroupAttendance from "@/components/StudentGroupAttendance";
import StudentAttendanceRequest from "@/components/StudentAttendanceRequest";
import AvatarUpload from "@/components/AvatarUpload";
import RegistrationChecklist from "@/components/RegistrationChecklist";
import { LeagueProgressBar, BadgeGrid } from "@/components/GamificationUI";
import { useGamification } from "@/hooks/useGamification";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { AchievementMilestoneCard } from "@/components/AchievementMilestoneCard";
import { LearningGoalsCard } from "@/components/LearningGoalsCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { StreakCalendar } from "@/components/StreakCalendar";
import { DailyBonusCard } from "@/components/DailyBonusCard";
import { AlertCircle, CheckCircle2, AlertTriangle, Package, CalendarCheck, Users, CreditCard, BookOpen, GraduationCap, RotateCcw, ChevronDown, Gamepad2, Trophy, Zap, Pencil, Check, X, FlameIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLevelByKey } from "@/constants/levels";

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
  const { loading: gateLoading, resetBlocked } = useResetGate();
  const { progress: gamification, league, loading: gamLoading } = useGamification();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [profileLevel, setProfileLevel] = useState("");
  const [placementTest, setPlacementTest] = useState<PlacementTestResult | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [latestEnrollmentId, setLatestEnrollmentId] = useState("");
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

        const dates: AttendanceDate[] = [];
        if (adminRes.data) {
          for (const r of adminRes.data) {
            dates.push({ date: r.session_date, source: "Admin" });
          }
        }
        if (pkgRes.data) {
          for (const r of pkgRes.data) {
            const sessions = r.pkg_group_sessions as { session_date: string } | null;
            if (sessions?.session_date) {
              dates.push({ date: sessions.session_date, source: "Group" });
            }
          }
        }
        if (selfRes.data) {
          for (const r of selfRes.data) {
            dates.push({ date: r.request_date, source: "Self" });
          }
        }
        dates.sort((a, b) => a.date.localeCompare(b.date));
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
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load your dashboard. Please refresh.");
        setLoading(false);
      }
    };
    load();
  }, [navigate, gateLoading, resetBlocked]);

  const handleItemCompleted = (key: string, _value: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, completed: true } : item))
    );
    if (key === "Full name") setUserName(_value);
  };

  if (gateLoading || resetBlocked || loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <main className="pt-24 pb-16 px-4">
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
        <main className="pt-24 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-sm">
            <p className="text-destructive font-medium">Failed to load dashboard</p>
            <p className="text-muted-foreground text-sm">{fetchError}</p>
            <button
              onClick={() => { setFetchError(null); setLoading(true); }}
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

  const quickStats = [
    { label: "Total XP", value: gamification.totalXp.toLocaleString(), icon: Zap, color: "text-yellow-600 bg-yellow-100" },
    { label: "Day Streak", value: `${gamification.streak.current_streak}d`, icon: FlameIcon, color: "text-orange-600 bg-orange-100" },
    { label: "Lessons Done", value: `${lessonsCompleted}/45`, icon: BookOpen, color: "text-green-600 bg-green-100" },
    { label: "League", value: league?.emoji ? `${league.emoji} ${league.name.split(" ")[0]}` : "Beginner", icon: Trophy, color: "text-blue-600 bg-blue-100" },
  ];

  const quickActions = [
    { label: "Textbook", desc: "Continue lessons", emoji: "📚", path: "/textbook", color: "hover:border-blue-400/60 hover:bg-blue-50/50" },
    { label: "Daily Quiz", desc: "+30 XP reward", emoji: "⚡", path: "/daily-quiz", color: "hover:border-yellow-400/60 hover:bg-yellow-50/50" },
    { label: "Games", desc: "13 fun games", emoji: "🎮", path: "/games", color: "hover:border-green-400/60 hover:bg-green-50/50" },
    { label: "Vocab Review", desc: "Spaced repetition", emoji: "🧠", path: "/review", color: "hover:border-purple-400/60 hover:bg-purple-50/50" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header row */}
          <div>
            <p className="text-sm text-muted-foreground">{todayStr}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{greeting}, {displayName.split(" ")[0]} 👋</h1>
          </div>

          {/* ── Quick Stats (always visible) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickStats.map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-bold text-foreground text-sm leading-tight truncate">{value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Daily Bonus (always visible, dismisses when claimed) ── */}
          <DailyBonusCard />

          {/* ── Quick Actions (always visible) ── */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">What to do today</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map(({ label, desc, emoji, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`group rounded-2xl border border-border bg-card p-4 text-left hover:shadow-md transition-all ${color}`}
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {hasNoData ? (
            /* ── No-enrollment state: show learning features + enroll CTA ── */
            <div className="space-y-6">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 text-center space-y-3">
                  <AlertCircle className="h-10 w-10 mx-auto text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">No Active Plan Yet</h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">Enroll to get live classes, personalized coaching, and track your attendance.</p>
                  <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
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
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5" /> My League</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LeagueProgressBar totalXp={gamification.totalXp} />
                    {gamification.badges.length > 0 ? (
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
                    {gamification.badges.length > 0 ? (
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
                        <div className="grid grid-cols-4 gap-2">
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
                      <div className="grid grid-cols-4 gap-2">
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
              <StudentGroupAttendance />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;

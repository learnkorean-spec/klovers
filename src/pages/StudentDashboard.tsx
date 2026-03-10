import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetGate } from "@/hooks/useResetGate";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyStepper from "@/components/JourneyStepper";
import StudentGroupAttendance from "@/components/StudentGroupAttendance";
import StudentAttendanceRequest from "@/components/StudentAttendanceRequest";
import AvatarUpload from "@/components/AvatarUpload";
import RegistrationChecklist from "@/components/RegistrationChecklist";
import { LeagueProgressBar, StreakDisplay, BadgeGrid } from "@/components/GamificationUI";
import { useGamification } from "@/hooks/useGamification";
import { LogOut, AlertCircle, CheckCircle2, AlertTriangle, Package, CalendarDays, CalendarCheck, Users, CreditCard, BookOpen, GraduationCap, RotateCcw, ChevronDown, Gamepad2, Trophy, Zap, Pencil, Check, X } from "lucide-react";
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
        const latestEnroll = enrollmentData[0] as any;
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
          for (const r of adminRes.data as any[]) {
            dates.push({ date: r.session_date, source: "Admin" });
          }
        }
        if (pkgRes.data) {
          for (const r of pkgRes.data as any[]) {
            if (r.pkg_group_sessions?.session_date) {
              dates.push({ date: r.pkg_group_sessions.session_date, source: "Group" });
            }
          }
        }
        if (selfRes.data) {
          for (const r of selfRes.data as any[]) {
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
          setGroupName((groupData[0] as any).pkg_groups?.name || null);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (gateLoading || resetBlocked || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
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
  // Stage 2 = Active (has approved+paid enrollment), stage 1 = Enrolled (waiting)
  const journeyStage = enrollments.length > 0 ? 2 : 1;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/schedule")}>
                <CalendarDays className="h-4 w-4 mr-2" /> My Schedule
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>

          {hasNoData ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 text-center space-y-3">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                  <h2 className="text-xl font-semibold text-foreground">No Active Plan</h2>
                  <p className="text-muted-foreground">You don't have an active plan yet.</p>
                  <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
                </CardContent>
              </Card>

              {/* Placement Test for users without enrollment */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Korean Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileLevel ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="text-sm px-3 py-1">
                          {getLevelByKey(profileLevel)?.shortLabel || profileLevel}
                        </Badge>
                        {placementTest && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Placement score: {placementTest.score}/40 — {new Date(placementTest.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake Test
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
            </div>
          ) : (
            <>
              {/* Welcome + Avatar */}
              <ProfileCard
                userId={userId}
                avatarUrl={avatarUrl}
                displayName={displayName}
                enrollmentCount={enrollments.length}
                journeyStage={journeyStage}
                onAvatarUploaded={(url) => setAvatarUrl(url)}
                onNameUpdated={(name) => setUserName(name)}
              />

              {/* Placement Test Level */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Korean Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileLevel ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="text-sm px-3 py-1">
                          {getLevelByKey(profileLevel)?.shortLabel || profileLevel}
                        </Badge>
                        {placementTest && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Placement score: {placementTest.score}/40 — {new Date(placementTest.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake Test
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

              {/* Registration Checklist */}
              <RegistrationChecklist userId={userId} enrollmentId={latestEnrollmentId} items={checklistItems} onItemCompleted={handleItemCompleted} autoFocusField={autoFocusField} />

              {/* League & XP Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    My League
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LeagueProgressBar totalXp={gamification.totalXp} />
                  <StreakDisplay currentStreak={gamification.streak.current_streak} longestStreak={gamification.streak.longest_streak} />
                  {gamification.badges.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Earned Badges</p>
                      <BadgeGrid earnedBadges={gamification.badges} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Games CTA */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Learn & Play</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Earn 5 XP per correct answer
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate("/games")}>
                      Play Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Request */}
              <StudentAttendanceRequest userId={userId} />

              {/* All Packages with auto-calculated stats */}
              {enrollments.map((enrollment) => {
                const totalUsed = enrollment.id === latestEnrollmentId ? attendanceDates.length : (enrollment.sessions_total - enrollment.sessions_remaining);
                const packageSize = enrollment.sessions_total;
                const remaining = packageSize - totalUsed;
                const extra = remaining < 0 ? Math.abs(remaining) : 0;
                const due = Math.round(extra * enrollment.unit_price);
                const curr = enrollment.currency === "EGP" ? "LE" : "$";

                return (
                  <Card key={enrollment.id} className={remaining === 0 && totalUsed > 0 ? "border-green-500 border-2" : ""}>
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
                        <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                          <span className="text-[10px] text-muted-foreground">Package</span>
                          <p className="text-xl font-bold text-foreground">{packageSize}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                          <span className="text-[10px] text-muted-foreground">Used</span>
                          <p className="text-xl font-bold text-foreground">{totalUsed}</p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${remaining >= 0 ? "bg-muted/50 border border-border" : "bg-destructive/10 border border-destructive/30"}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {remaining >= 0 ? "Remaining" : "Extra"}
                          </span>
                          <p className={`text-xl font-bold ${remaining >= 0 ? "text-foreground" : "text-destructive"}`}>
                            {remaining >= 0 ? remaining : extra}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${due > 0 ? "bg-destructive/10" : "bg-muted/50"} border border-border`}>
                          <span className="text-[10px] text-muted-foreground">Due</span>
                          <p className={`text-xl font-bold ${due > 0 ? "text-destructive" : "text-foreground"}`}>
                            {curr}{due.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {remaining >= 0 ? (
                        <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 border border-border rounded-lg p-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          <span><strong>{remaining}</strong> session{remaining !== 1 ? "s" : ""} remaining</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span><strong>{extra}</strong> extra — Due: <strong>{curr}{due.toLocaleString()}</strong></span>
                        </div>
                      )}

                      {/* Plan Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm border border-border rounded-lg p-3">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium capitalize">{enrollment.plan_type} {enrollment.duration}mo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Paid:</span>
                          <span className="font-medium">{curr}{Math.round(enrollment.amount).toLocaleString()}</span>
                        </div>
                        {enrollment.id === latestEnrollmentId && groupName && (
                          <div className="flex items-center gap-1.5 col-span-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Group:</span>
                            <span className="font-medium">{groupName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Unit price:</span>
                          <span className="font-medium">{curr}{Math.round(enrollment.unit_price).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Read-only Attendance Dates List */}
              {attendanceDates.length > 0 && (
                <AttendanceHistoryCard dates={attendanceDates} />
              )}

              {/* Group Attendance */}
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

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { LogOut, AlertCircle, CheckCircle2, AlertTriangle, Package, CalendarDays, CalendarCheck } from "lucide-react";

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

const StudentDashboard = () => {
  const { loading: gateLoading, resetBlocked } = useResetGate();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [hasNoData, setHasNoData] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [latestEnrollmentId, setLatestEnrollmentId] = useState("");
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (gateLoading || resetBlocked) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, name, level, country")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        setAvatarUrl((profile as any).avatar_url || "");
        setUserName((profile as any).name || "");
      }

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id, plan_type, duration, sessions_total, sessions_remaining, unit_price, amount, currency, created_at, preferred_days, timezone")
        .eq("user_id", session.user.id)
        .eq("approval_status", "APPROVED")
        .eq("payment_status", "PAID")
        .order("created_at", { ascending: false });

      if (enrollmentData && enrollmentData.length > 0) {
        setEnrollments(enrollmentData as EnrollmentRecord[]);
        const latestEnroll = enrollmentData[0] as any;
        setLatestEnrollmentId(latestEnroll.id);

        const p = profile as any;
        const items: ChecklistItem[] = [
          { key: "Full name", label: "Full name", completed: !!(p?.name && p.name.trim() !== "") },
          { key: "Korean level", label: "Korean level", completed: !!(p?.level && p.level.trim() !== "") },
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
            .from("pkg_attendance" as any)
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
      } else {
        setHasNoData(true);
      }

      setLoading(false);
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

  const displayName = userName || "Student";
  const hasBlockers = checklistItems.some(
    (i) => !i.completed && (i.key === "Preferred class days" || i.key === "Korean level")
  );
  const journeyStage = hasBlockers ? 1 : 2;

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
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">No Active Plan</h2>
                <p className="text-muted-foreground">You don't have an active plan yet.</p>
                <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Welcome + Avatar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <AvatarUpload userId={userId} currentUrl={avatarUrl} name={displayName} onUploaded={(url) => setAvatarUrl(url)} />
                    <div>
                      <p className="font-semibold text-foreground text-lg">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{enrollments.length} active package{enrollments.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <JourneyStepper currentStage={journeyStage} />
                </CardContent>
              </Card>

              {/* Registration Checklist */}
              <RegistrationChecklist userId={userId} enrollmentId={latestEnrollmentId} items={checklistItems} onItemCompleted={handleItemCompleted} />

              {/* Attendance Request */}
              <StudentAttendanceRequest userId={userId} />

              {/* All Packages with auto-calculated stats */}
              {enrollments.map((enrollment) => {
                const totalUsed = enrollment.id === latestEnrollmentId ? attendanceDates.length : (enrollment.sessions_total - enrollment.sessions_remaining);
                const packageSize = enrollment.sessions_total;
                const remaining = packageSize - totalUsed;
                const extra = remaining < 0 ? Math.abs(remaining) : 0;
                const due = extra * enrollment.unit_price;
                const curr = enrollment.currency === "EGP" ? "LE" : "$";

                return (
                  <Card key={enrollment.id}>
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
                        <div className="rounded-lg bg-accent/50 p-3 text-center">
                          <span className="text-[10px] text-muted-foreground">Package</span>
                          <p className="text-xl font-bold text-foreground">{packageSize}</p>
                        </div>
                        <div className="rounded-lg bg-accent/50 p-3 text-center">
                          <span className="text-[10px] text-muted-foreground">Used</span>
                          <p className="text-xl font-bold text-foreground">{totalUsed}</p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${remaining >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {remaining >= 0 ? "Remaining" : "Extra"}
                          </span>
                          <p className={`text-xl font-bold ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                            {remaining >= 0 ? remaining : extra}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${due > 0 ? "bg-destructive/10" : "bg-accent/50"}`}>
                          <span className="text-[10px] text-muted-foreground">Due</span>
                          <p className={`text-xl font-bold ${due > 0 ? "text-destructive" : "text-foreground"}`}>
                            {curr}{due.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {remaining >= 0 ? (
                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg p-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span><strong>{remaining}</strong> session{remaining !== 1 ? "s" : ""} remaining</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span><strong>{extra}</strong> extra — Due: <strong>{curr}{due.toLocaleString()}</strong></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Read-only Attendance Dates List */}
              {attendanceDates.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5" />
                      Attendance History ({attendanceDates.length} sessions)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {attendanceDates.map((d, i) => (
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
                </Card>
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

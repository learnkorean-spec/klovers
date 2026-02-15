import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { LogOut, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface EnrollmentRecord {
  id: string;
  plan_type: string;
  duration: number;
  sessions_total: number;
  sessions_remaining: number;
  unit_price: number;
  amount: number;
  currency: string;
}

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  status: string;
  course_type: string;
  package_name: string;
  total_classes: number;
  used_classes: number;
  remaining_classes: number;
  total_paid: number;
  price_per_class: number;
  payment_status: string;
  group_name: string;
}

interface AttendanceEntry {
  id: string;
  marked_at: string;
  notes: string;
}

const StudentDashboard = () => {
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [hasNoData, setHasNoData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);

      // Fetch profile for avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        setAvatarUrl((profile as any).avatar_url || "");
        setUserName((profile as any).name || "");
      }

      // Fetch latest APPROVED+PAID enrollment
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id, plan_type, duration, sessions_total, sessions_remaining, unit_price, amount, currency")
        .eq("user_id", session.user.id)
        .eq("approval_status", "APPROVED")
        .eq("payment_status", "PAID")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (enrollmentData) {
        setEnrollment(enrollmentData as EnrollmentRecord);
      } else {
        // Fallback: legacy students table
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .eq("email", session.user.email!)
          .maybeSingle();

        if (studentData) {
          setStudent(studentData as any);
          // Fetch legacy attendance log
          const { data: attendData } = await supabase
            .from("attendance_log")
            .select("id, marked_at, notes")
            .eq("student_id", (studentData as any).id)
            .order("marked_at", { ascending: false });
          if (attendData) setAttendance(attendData as any);
        } else {
          setHasNoData(true);
        }
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  // Computed values for enrollment
  const totalAttended = enrollment ? enrollment.sessions_total - enrollment.sessions_remaining : 0;
  const remaining = enrollment ? enrollment.sessions_remaining : 0;
  const extraSessions = remaining < 0 ? Math.abs(remaining) : 0;
  const amountDue = extraSessions * (enrollment?.unit_price || 0);
  const currLabel = enrollment?.currency === "EGP" ? "LE" : "$";
  const displayName = userName || student?.full_name || "Student";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>

          {hasNoData ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">No Active Plan</h2>
                <p className="text-muted-foreground">You don't have an active plan yet. Contact us to get started.</p>
                <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
              </CardContent>
            </Card>
          ) : enrollment ? (
            <>
              {/* Welcome + Avatar + Journey */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <AvatarUpload
                      userId={userId}
                      currentUrl={avatarUrl}
                      name={displayName}
                      onUploaded={(url) => setAvatarUrl(url)}
                    />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Welcome back, <span className="font-semibold text-foreground">{displayName}</span>
                  </p>
                  <JourneyStepper
                    currentStage={
                      enrollment.sessions_remaining <= 0 && enrollment.sessions_total > 0 ? 3 : 2
                    }
                  />
                </CardContent>
              </Card>

              {/* Attendance Calendar */}
              <StudentAttendanceRequest userId={userId} />

              {/* Unified Package & Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Plan:</span>
                      <p className="font-medium text-foreground capitalize">{enrollment.plan_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium text-foreground">{enrollment.duration} month{enrollment.duration > 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Package Size:</span>
                      <p className="font-medium text-foreground">{enrollment.sessions_total} sessions</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price Paid:</span>
                      <p className="font-medium text-foreground">{currLabel}{enrollment.amount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price per Session:</span>
                      <p className="font-medium text-foreground">{currLabel}{enrollment.unit_price}</p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                    <div className="rounded-lg bg-accent/50 p-3 text-center">
                      <span className="text-xs text-muted-foreground">Attended</span>
                      <p className="text-2xl font-bold text-foreground">{totalAttended}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${remaining >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                      <span className="text-xs text-muted-foreground">
                        {remaining >= 0 ? "Remaining" : "Extra Sessions"}
                      </span>
                      <p className={`text-2xl font-bold ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                        {remaining >= 0 ? remaining : extraSessions}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${amountDue > 0 ? "bg-destructive/10" : "bg-accent/50"}`}>
                      <span className="text-xs text-muted-foreground">Amount Due</span>
                      <p className={`text-2xl font-bold ${amountDue > 0 ? "text-destructive" : "text-foreground"}`}>
                        {currLabel}{amountDue}
                      </p>
                    </div>
                  </div>

                  {/* Status Message */}
                  {remaining >= 0 ? (
                    <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg p-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>You have <strong>{remaining}</strong> session{remaining !== 1 ? "s" : ""} remaining</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>You have <strong>{extraSessions}</strong> extra session{extraSessions !== 1 ? "s" : ""}. Amount due: <strong>{currLabel}{amountDue}</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Group Attendance */}
              <StudentGroupAttendance />
            </>
          ) : student ? (
            /* Legacy fallback for students without enrollments */
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <AvatarUpload
                      userId={userId}
                      currentUrl={avatarUrl}
                      name={userName || student.full_name}
                      onUploaded={(url) => setAvatarUrl(url)}
                    />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Welcome back, <span className="font-semibold text-foreground">{student.full_name}</span>
                  </p>
                  <JourneyStepper
                    currentStage={
                      student.used_classes >= student.total_classes && student.total_classes > 0 ? 3
                        : student.status === "student" ? 2 : 1
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Package Details (Legacy)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Package:</span>
                      <p className="font-medium text-foreground">{student.package_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Classes:</span>
                      <p className="font-medium text-foreground">{student.total_classes}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Used:</span>
                      <p className="font-medium text-foreground">{student.used_classes}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remaining:</span>
                      <p className="font-medium text-foreground">{student.total_classes - student.used_classes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <StudentGroupAttendance />

              {attendance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {attendance.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm text-foreground">
                            {new Date(a.marked_at).toLocaleDateString()} — {new Date(a.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {a.notes && <span className="text-xs text-muted-foreground">{a.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;

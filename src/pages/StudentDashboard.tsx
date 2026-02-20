import { useEffect, useState } from "react";
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
import { LogOut, AlertCircle, CheckCircle2, AlertTriangle, Package, Info, CalendarDays } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

const StudentDashboard = () => {
  const { loading: gateLoading, resetBlocked } = useResetGate();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [hasNoData, setHasNoData] = useState(false);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
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

      // Fetch ALL approved+paid enrollments
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id, plan_type, duration, sessions_total, sessions_remaining, unit_price, amount, currency, created_at, preferred_days, timezone")
        .eq("user_id", session.user.id)
        .eq("approval_status", "APPROVED")
        .eq("payment_status", "PAID")
        .order("created_at", { ascending: false });

      if (enrollmentData && enrollmentData.length > 0) {
        setEnrollments(enrollmentData as EnrollmentRecord[]);

        // Check for missing information across profile + enrollments
        const missing: string[] = [];
        const p = profile as any;
        if (!p?.name || p.name.trim() === "") missing.push("Full name");
        if (!p?.level || p.level.trim() === "") missing.push("Korean level");
        if (!p?.country || p.country.trim() === "") missing.push("Country");

        const latestEnroll = enrollmentData[0] as any;
        if (!latestEnroll.preferred_days || latestEnroll.preferred_days.length === 0) missing.push("Preferred class days");
        if (!latestEnroll.timezone || latestEnroll.timezone.trim() === "") missing.push("Timezone");

        setMissingInfo(missing);
      } else {
        setHasNoData(true);
      }

      setLoading(false);
    };
    load();
  }, [navigate, gateLoading, resetBlocked]);

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
                    <AvatarUpload
                      userId={userId}
                      currentUrl={avatarUrl}
                      name={displayName}
                      onUploaded={(url) => setAvatarUrl(url)}
                    />
                    <div>
                      <p className="font-semibold text-foreground text-lg">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{enrollments.length} active package{enrollments.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <JourneyStepper currentStage={2} />
                </CardContent>
              </Card>

              {/* Missing Info Alert */}
              {missingInfo.length > 0 && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <Info className="h-4 w-4" />
                  <AlertTitle>We need a few details from you</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2 text-sm">Please contact us or update the following so we can finalize your schedule:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {missingInfo.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Attendance Request */}
              <StudentAttendanceRequest userId={userId} />

              {/* All Packages */}
              {enrollments.map((enrollment, idx) => {
                const attended = enrollment.sessions_total - enrollment.sessions_remaining;
                const remaining = enrollment.sessions_remaining;
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
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-accent/50 p-3 text-center">
                          <span className="text-xs text-muted-foreground">Attended</span>
                          <p className="text-xl font-bold text-foreground">{attended}</p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${remaining >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                          <span className="text-xs text-muted-foreground">
                            {remaining >= 0 ? "Remaining" : "Extra"}
                          </span>
                          <p className={`text-xl font-bold ${remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                            {remaining >= 0 ? remaining : extra}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${due > 0 ? "bg-destructive/10" : "bg-accent/50"}`}>
                          <span className="text-xs text-muted-foreground">Due</span>
                          <p className={`text-xl font-bold ${due > 0 ? "text-destructive" : "text-foreground"}`}>
                            {curr}{due}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      {remaining >= 0 ? (
                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg p-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span><strong>{remaining}</strong> session{remaining !== 1 ? "s" : ""} remaining</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span><strong>{extra}</strong> extra — Due: <strong>{curr}{due}</strong></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

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

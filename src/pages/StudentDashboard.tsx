import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LogOut, BookOpen, Calendar, AlertCircle, Info } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  status: string;
  credits: number;
  level: string;
  country: string;
}

interface Enrollment {
  id: string;
  approval_status: string;
  payment_status: string;
  sessions_remaining: number;
  sessions_total: number;
  plan_type: string;
  matched_batch_id: string | null;
  currency?: string;
}

interface AttendanceRequest {
  id: string;
  request_date: string;
  status: string;
  created_at: string;
}

const StudentDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRequest[]>([]);
  const [requestDate, setRequestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const isPendingPayment = !!enrollment && enrollment.approval_status === "PENDING_PAYMENT";
  const isUnderReview = !!enrollment && enrollment.approval_status === "UNDER_REVIEW";

  const isActive =
    !!enrollment &&
    enrollment.approval_status === "APPROVED" &&
    enrollment.payment_status === "PAID" &&
    enrollment.sessions_remaining > 0;

  const isPending =
    !!enrollment &&
    !isPendingPayment &&
    !isUnderReview &&
    (enrollment.approval_status === "PENDING" || enrollment.payment_status !== "PAID");

  const displayStatus = isActive
    ? "ACTIVE"
    : isPendingPayment
      ? "PENDING PAYMENT"
      : isUnderReview
        ? "UNDER REVIEW"
        : isPending
          ? "PENDING"
          : enrollment && enrollment.sessions_remaining <= 0
            ? "OVERDUE"
            : "NEW";

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "default";
      case "OVERDUE": return "destructive";
      case "PENDING": return "secondary";
      default: return "outline";
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const [profileRes, enrollmentRes, attendanceRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single(),
        supabase
          .from("enrollments")
          .select("id, approval_status, payment_status, sessions_remaining, sessions_total, plan_type, matched_batch_id, currency")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("attendance_requests")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data as any);
      if (enrollmentRes.data) setEnrollment(enrollmentRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data as any);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleRequestAttendance = async () => {
    if (!requestDate || !enrollment) return;
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSubmitting(false); return; }

    const { error } = await supabase.from("attendance_requests").insert({
      user_id: session.user.id,
      enrollment_id: enrollment.id,
      request_date: requestDate,
    } as any);

    if (error) {
      const msg = error.message?.includes("duplicate")
        ? "You already have a request for this date."
        : "Failed to submit request.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Attendance requested" });
      setRequestDate("");
      // Refetch attendance
      const { data } = await supabase
        .from("attendance_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setAttendance(data as any);
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>

          {/* Profile summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-foreground" />
                <p className="text-3xl font-bold text-foreground">{enrollment?.sessions_remaining ?? 0}</p>
                <p className="text-sm text-muted-foreground">Sessions remaining</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge variant={statusColor(displayStatus) as any} className="text-lg px-4 py-1">
                  {displayStatus}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Level</p>
                <p className="font-semibold text-foreground">{profile?.level || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">{profile?.country}</p>
              </CardContent>
            </Card>
          </div>

          {/* Conditional sections based on enrollment state */}
          {!enrollment && (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">No Active Plan</h2>
                <p className="text-muted-foreground">You don't have an active plan yet. Enroll to start your classes.</p>
                <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
              </CardContent>
            </Card>
          )}

          {enrollment && isPendingPayment && (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Complete Your Payment</h2>
                <p className="text-muted-foreground">Your order has been created. Please upload your payment receipt.</p>
                <Button onClick={() => navigate(`/pay/${enrollment.id}`)} size="lg">Upload Payment Receipt</Button>
              </CardContent>
            </Card>
          )}

          {enrollment && isUnderReview && (
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <Info className="h-10 w-10 mx-auto text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Payment Under Review</h2>
                <p className="text-muted-foreground">Your payment receipt is being reviewed. We'll notify you once it's approved.</p>
              </CardContent>
            </Card>
          )}

          {enrollment && isPending && (
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <Info className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Your enrollment is pending approval.</p>
              </CardContent>
            </Card>
          )}

          {enrollment && !isPending && !isPendingPayment && !isUnderReview && !isActive && enrollment.sessions_remaining <= 0 && (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
                <h2 className="text-xl font-semibold text-foreground">No Sessions Remaining</h2>
                <p className="text-muted-foreground">You've used all your sessions. Enroll again to continue learning.</p>
                <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
              </CardContent>
            </Card>
          )}

          {isActive && (
            <>
              {enrollment.plan_type === "GROUP" && !enrollment.matched_batch_id && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Awaiting batch assignment.</p>
                  </CardContent>
                </Card>
              )}

              {/* Request attendance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Request Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} />
                    <Button onClick={handleRequestAttendance} disabled={!requestDate || submitting}>
                      {submitting ? "Submitting..." : "Request"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance history */}
              {attendance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {attendance.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm text-foreground">{a.request_date}</span>
                          <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                            {a.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Enroll CTA */}
          <div className="text-center">
            <Button onClick={() => navigate("/enroll")} size="lg">Enroll in a New Plan</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;

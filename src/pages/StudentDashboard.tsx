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
import { LogOut, BookOpen, Calendar } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  status: string;
  credits: number;
  level: string;
  country: string;
}

interface AttendanceRequest {
  id: string;
  request_date: string;
  status: string;
  created_at: string;
}

const StudentDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRequest[]>([]);
  const [requestDate, setRequestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileData) setProfile(profileData as any);

      const { data: attendanceData } = await supabase
        .from("attendance_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (attendanceData) setAttendance(attendanceData as any);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleRequestAttendance = async () => {
    if (!requestDate) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("attendance_requests").insert({
      user_id: session.user.id,
      request_date: requestDate,
    } as any);

    if (error) {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    } else {
      toast({ title: "Attendance requested" });
      setRequestDate("");
      // Refresh
      const { data } = await supabase
        .from("attendance_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setAttendance(data as any);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayStatus = profile?.credits !== undefined && profile.credits <= 0 && profile.status === "ACTIVE"
    ? "OVERDUE"
    : profile?.status || "NEW";

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "default";
      case "OVERDUE": return "destructive";
      case "PENDING_PAYMENT": return "secondary";
      default: return "outline";
    }
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
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{profile?.credits ?? 0}</p>
                <p className="text-sm text-muted-foreground">Credits remaining</p>
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
                <Button onClick={handleRequestAttendance} disabled={!requestDate}>Request</Button>
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

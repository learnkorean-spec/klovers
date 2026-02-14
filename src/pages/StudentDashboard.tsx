import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyStepper from "@/components/JourneyStepper";
import StudentGroupAttendance from "@/components/StudentGroupAttendance";
import { LogOut, BookOpen, DollarSign, Calendar, AlertCircle } from "lucide-react";

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
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      // Fetch student record by matching email
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("email", session.user.email!)
        .maybeSingle();

      if (studentData) {
        setStudent(studentData as any);
        // Fetch attendance log
        const { data: attendData } = await supabase
          .from("attendance_log")
          .select("id, marked_at, notes")
          .eq("student_id", (studentData as any).id)
          .order("marked_at", { ascending: false });
        if (attendData) setAttendance(attendData as any);
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

          {!student ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">No Active Plan</h2>
                <p className="text-muted-foreground">You don't have an active plan yet. Contact us to get started.</p>
                <Button onClick={() => navigate("/enroll-now")} size="lg">Enroll Now</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Welcome */}
              <div>
                <p className="text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{student.full_name}</span></p>
              </div>

              {/* Journey Progress */}
              <Card>
                <CardContent className="pt-6">
                  <JourneyStepper
                    currentStage={
                      student.used_classes >= student.total_classes && student.total_classes > 0
                        ? 3 // Completed
                        : student.status === "student"
                        ? 2 // Active
                        : 1 // Enrolled
                    }
                  />
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <BookOpen className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{student.remaining_classes}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold text-foreground">{student.used_classes}</p>
                    <p className="text-xs text-muted-foreground">Used</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold text-foreground">${student.total_paid}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant={student.payment_status === "paid" ? "default" : "secondary"} className="text-sm">
                      {student.payment_status.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Package Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Package Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Package:</span>
                      <p className="font-medium text-foreground">{student.package_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course Type:</span>
                      <p className="font-medium text-foreground">{student.course_type || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Group:</span>
                      <p className="font-medium text-foreground">{student.group_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Classes:</span>
                      <p className="font-medium text-foreground">{student.total_classes}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price / Class:</span>
                      <p className="font-medium text-foreground">${student.price_per_class}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Attendance */}
              <StudentGroupAttendance />

              {/* Attendance History */}
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;

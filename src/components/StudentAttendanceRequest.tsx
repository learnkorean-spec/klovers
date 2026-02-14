import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

interface AttendanceRequest {
  id: string;
  request_date: string;
  status: string;
  created_at: string;
}

interface StudentAttendanceRequestProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  PENDING: { label: "Pending", icon: Clock, variant: "secondary", color: "text-muted-foreground" },
  APPROVED: { label: "Approved", icon: CheckCircle2, variant: "default", color: "text-primary" },
  REJECTED: { label: "Rejected", icon: XCircle, variant: "destructive", color: "text-destructive" },
};

const StudentAttendanceRequest = ({ userId }: StudentAttendanceRequestProps) => {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, approval_status, payment_status, sessions_remaining")
      .eq("user_id", userId)
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID")
      .order("created_at", { ascending: false })
      .limit(1);

    if (enrollments && enrollments.length > 0) {
      setEnrollmentId(enrollments[0].id);
    }

    const { data: reqs } = await supabase
      .from("attendance_requests")
      .select("id, request_date, status, created_at")
      .eq("user_id", userId)
      .order("request_date", { ascending: false });

    if (reqs) setRequests(reqs as AttendanceRequest[]);
    setLoading(false);
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !enrollmentId || submitting) return;

    const dateStr = format(date, "yyyy-MM-dd");

    const exists = requests.find(r => r.request_date === dateStr && r.status !== "REJECTED");
    if (exists) {
      toast({ title: "Already requested", description: "You already have a request for this date.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("attendance_requests")
      .insert({
        user_id: userId,
        enrollment_id: enrollmentId,
        request_date: dateStr,
      } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance submitted!", description: `${format(date, "MMM d, yyyy")} added.` });
      loadData();
    }
    setSubmitting(false);
  };

  // Build modifier sets for calendar highlighting
  const approvedDates = useMemo(
    () => requests.filter(r => r.status === "APPROVED").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );
  const pendingDates = useMemo(
    () => requests.filter(r => r.status === "PENDING").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );
  const rejectedDates = useMemo(
    () => requests.filter(r => r.status === "REJECTED").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );

  const modifiers = { approved: approvedDates, pending: pendingDates, rejected: rejectedDates };
  const modifiersStyles = {
    approved: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    pending: { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: "9999px" },
    rejected: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", borderRadius: "9999px" },
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {/* Interactive Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            My Class Dates
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {enrollmentId
              ? "Tap a date to mark your attendance"
              : "You need an active enrollment to add dates"}
          </p>
          <div className="flex gap-3 flex-wrap mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Rejected</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {submitting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </div>
          )}
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={enrollmentId ? handleDateSelect : undefined}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            disabled={!enrollmentId ? () => true : (date) => date > new Date() || date < new Date("2024-01-01")}
            className={cn("p-3 pointer-events-auto w-full")}
          />
        </CardContent>
      </Card>

      {/* Written list of requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requests.map((r) => {
                const cfg = statusConfig[r.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-muted", cfg.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDate(r.request_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAttendanceRequest;

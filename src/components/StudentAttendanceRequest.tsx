import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

interface AttendanceRequest {
  id: string;
  request_date: string;
  status: string;
  created_at: string;
}

interface StudentAttendanceRequestProps {
  userId: string;
}

const statusConfig: Record<string, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { icon: Clock, variant: "secondary" },
  APPROVED: { icon: CheckCircle2, variant: "default" },
  REJECTED: { icon: XCircle, variant: "destructive" },
};

const StudentAttendanceRequest = ({ userId }: StudentAttendanceRequestProps) => {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    // Find active enrollment for this user
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

    // Fetch existing requests
    const { data: reqs } = await supabase
      .from("attendance_requests")
      .select("id, request_date, status, created_at")
      .eq("user_id", userId)
      .order("request_date", { ascending: false });

    if (reqs) setRequests(reqs as AttendanceRequest[]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !enrollmentId) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Check for duplicate
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
      toast({ title: "Attendance submitted!", description: `Request for ${format(selectedDate, "MMM d, yyyy")} sent.` });
      setSelectedDate(undefined);
      setOpen(false);
      loadData();
    }
    setSubmitting(false);
  };

  if (loading) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            My Class Dates
          </CardTitle>
          {enrollmentId && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="default" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  <p className="text-sm font-medium text-foreground">Pick a class date</p>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                  />
                  <Button
                    className="w-full"
                    disabled={!selectedDate || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {selectedDate ? `Submit ${format(selectedDate, "MMM d")}` : "Select a date"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!enrollmentId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            You need an active enrollment to request attendance.
          </p>
        )}

        {requests.length === 0 && enrollmentId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No class dates added yet. Click "Add Date" to get started.
          </p>
        )}

        {requests.length > 0 && (
          <div className="space-y-2">
            {requests.map((r) => {
              const cfg = statusConfig[r.status] || statusConfig.PENDING;
              const Icon = cfg.icon;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center bg-muted",
                      r.status === "APPROVED" && "text-primary",
                      r.status === "PENDING" && "text-muted-foreground",
                      r.status === "REJECTED" && "text-destructive",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(r.request_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>
                    {r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : "Rejected"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentAttendanceRequest;

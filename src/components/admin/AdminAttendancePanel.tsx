import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarCheck, AlertTriangle, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminAttendancePanelProps {
  enrollmentId: string;
  userId: string;
  studentName: string;
  sessionsRemaining: number;
  negativeSessions: number;
  amountDue: number;
  currency: string | null;
  derivedStatus: string;
  onClose: () => void;
  onUpdated: () => void;
}

interface AttendanceRecord {
  id: string;
  session_date: string;
  status: string;
  created_at: string;
}

const AdminAttendancePanel = ({
  enrollmentId, userId, studentName, sessionsRemaining,
  negativeSessions, amountDue, currency, derivedStatus,
  onClose, onUpdated,
}: AdminAttendancePanelProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_attendance_log" as any)
      .select("id, session_date, status, created_at")
      .eq("enrollment_id", enrollmentId)
      .order("session_date", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setRecords((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [enrollmentId]);

  const attendedDates = useMemo(
    () => records.map(r => new Date(r.session_date + "T00:00:00")),
    [records]
  );

  const isLocked = derivedStatus === "LOCKED" || sessionsRemaining <= -3;
  const currLabel = currency === "EGP" ? "LE" : "$";

  const handleAddAttendance = async () => {
    if (!selectedDate) {
      toast({ title: "Select a date", variant: "destructive" });
      return;
    }
    setAdding(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase.rpc("admin_add_attendance" as any, {
      p_enrollment_id: enrollmentId,
      p_session_date: dateStr,
    });
    if (error) {
      const msg = error.message?.includes("duplicate")
        ? "Attendance already recorded for this date."
        : error.message?.includes("LOCKED")
        ? "Student is LOCKED (-3). Renew required."
        : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Attendance added", description: `Sessions remaining: ${data}` });
      setSelectedDate(undefined);
      fetchRecords();
      onUpdated();
    }
    setAdding(false);
  };

  const handleRemoveAttendance = async (sessionDate: string) => {
    const { data, error } = await supabase.rpc("admin_remove_attendance" as any, {
      p_enrollment_id: enrollmentId,
      p_session_date: sessionDate,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance removed", description: `Sessions remaining: ${data}` });
      fetchRecords();
      onUpdated();
    }
  };

  const modifiers = { attended: attendedDates };
  const modifiersStyles = {
    attended: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderRadius: "9999px",
    },
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Attendance — {studentName}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">Remaining: {sessionsRemaining}</Badge>
          {negativeSessions > 0 && (
            <Badge variant="destructive">Negative: {negativeSessions}</Badge>
          )}
          {amountDue > 0 && (
            <Badge variant="destructive">Due: {currLabel}{amountDue.toLocaleString()}</Badge>
          )}
          {isLocked && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> LOCKED — Renew required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar */}
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className={cn("p-3 pointer-events-auto w-full")}
          />
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Attended</span>
            </div>
          </div>
        </div>

        {/* Add button */}
        <Button
          onClick={handleAddAttendance}
          disabled={adding || !selectedDate || isLocked}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          {adding ? "Adding..." : selectedDate ? `Add attendance for ${format(selectedDate, "MMM d, yyyy")}` : "Select a date to add"}
        </Button>

        {/* Record list */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet.</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {new Date(r.session_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove attendance?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the attendance record for {r.session_date} and restore 1 session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveAttendance(r.session_date)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAttendancePanel;

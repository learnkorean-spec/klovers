import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CalendarCheck, AlertTriangle, Plus, Trash2, X,
  Pencil, Check, Users, CreditCard, BookOpen,
} from "lucide-react";
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

interface UnifiedRecord {
  id: string;
  session_date: string;
  source: "Admin" | "Group" | "Student";
  group_name?: string;
  created_at: string;
}

interface EnrollmentDetails {
  plan_type: string;
  duration: number;
  sessions_total: number;
  sessions_remaining: number;
  amount: number;
  unit_price: number;
  currency: string;
  payment_status: string;
  level: string | null;
}

const AdminAttendancePanel = ({
  enrollmentId, userId, studentName, sessionsRemaining,
  negativeSessions, amountDue, currency, derivedStatus,
  onClose, onUpdated,
}: AdminAttendancePanelProps) => {
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);

  // Inline editing state
  const [editingRemaining, setEditingRemaining] = useState(false);
  const [editRemaining, setEditRemaining] = useState("");
  const [editingUnitPrice, setEditingUnitPrice] = useState(false);
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editingPlan, setEditingPlan] = useState(false);
  const [editPlanType, setEditPlanType] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Parallel fetches
    const [enrollRes, adminRes, pkgRes, selfRes, groupRes] = await Promise.all([
      // Enrollment details
      supabase
        .from("enrollments")
        .select("plan_type, duration, sessions_total, sessions_remaining, amount, unit_price, currency, payment_status, level")
        .eq("id", enrollmentId)
        .single(),
      // Admin attendance log
      supabase
        .from("admin_attendance_log" as any)
        .select("id, session_date, created_at")
        .eq("enrollment_id", enrollmentId)
        .order("session_date", { ascending: false }),
      // Group attendance (pkg_attendance + pkg_group_sessions + pkg_groups)
      supabase
        .from("pkg_attendance" as any)
        .select("session_id, created_at, status, pkg_group_sessions(id, session_date, group_id, pkg_groups(name))")
        .eq("user_id", userId)
        .eq("admin_approved", true),
      // Self-reported (approved attendance_requests)
      supabase
        .from("attendance_requests")
        .select("id, request_date, created_at")
        .eq("enrollment_id", enrollmentId)
        .eq("status", "APPROVED")
        .order("request_date", { ascending: false }),
      // Group membership
      supabase
        .from("pkg_group_members" as any)
        .select("group_id, pkg_groups(name)")
        .eq("user_id", userId)
        .eq("member_status", "active")
        .limit(1),
    ]);

    // Set enrollment
    if (enrollRes.data) {
      setEnrollment(enrollRes.data as EnrollmentDetails);
    }

    // Set group name
    if (groupRes.data && groupRes.data.length > 0) {
      setGroupName((groupRes.data[0] as any).pkg_groups?.name || null);
    }

    // Merge records
    const unified: UnifiedRecord[] = [];

    // Admin logs
    if (adminRes.data) {
      for (const r of adminRes.data as any[]) {
        unified.push({
          id: r.id,
          session_date: r.session_date,
          source: "Admin",
          created_at: r.created_at,
        });
      }
    }

    // Group sessions
    if (pkgRes.data) {
      for (const r of pkgRes.data as any[]) {
        const session = r.pkg_group_sessions;
        unified.push({
          id: r.session_id,
          session_date: session.session_date,
          source: "Group",
          group_name: session.pkg_groups?.name || "",
          created_at: r.created_at,
        });
      }
    }

    // Self-reported
    if (selfRes.data) {
      for (const r of selfRes.data as any[]) {
        unified.push({
          id: r.id,
          session_date: r.request_date,
          source: "Student",
          created_at: r.created_at,
        });
      }
    }

    // Sort descending by date
    unified.sort((a, b) => b.session_date.localeCompare(a.session_date));
    setRecords(unified);
    setLoading(false);
  }, [enrollmentId, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Calendar modifiers by source
  const { groupDates, adminDates, studentDates } = useMemo(() => {
    const g: Date[] = [], a: Date[] = [], s: Date[] = [];
    for (const r of records) {
      const d = new Date(r.session_date + "T00:00:00");
      if (r.source === "Group") g.push(d);
      else if (r.source === "Admin") a.push(d);
      else s.push(d);
    }
    return { groupDates: g, adminDates: a, studentDates: s };
  }, [records]);

  const isLocked = derivedStatus === "LOCKED" || sessionsRemaining <= -3;
  const currLabel = currency === "EGP" ? "LE" : "$";
  const totalAttended = records.length;

  const handleAddAttendance = async () => {
    if (!selectedDate) return;
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
      fetchAll();
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
      fetchAll();
      onUpdated();
    }
  };

  const handleSaveRemaining = async () => {
    const val = parseInt(editRemaining, 10);
    if (isNaN(val)) return;
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ sessions_remaining: val } as any)
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Sessions remaining set to ${val}` });
      setEditingRemaining(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleSaveUnitPrice = async () => {
    const val = parseFloat(editUnitPrice);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ unit_price: val } as any)
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Unit price set to ${currLabel}${val}` });
      setEditingUnitPrice(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleSavePlan = async () => {
    if (!editPlanType || !editDuration) return;
    const dur = parseInt(editDuration, 10);
    if (![1, 3, 6].includes(dur)) return;
    setSaving(true);
    const newTotal = dur === 1 ? 4 : dur === 3 ? 12 : 24;
    const { error } = await supabase
      .from("enrollments")
      .update({ plan_type: editPlanType, duration: dur, sessions_total: newTotal } as any)
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Plan set to ${editPlanType} ${dur}mo` });
      setEditingPlan(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleUnlock = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ sessions_remaining: 0 } as any)
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Unlocked", description: "Sessions remaining reset to 0. Student is now active." });
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const sourceBadgeVariant = (s: UnifiedRecord["source"]) =>
    s === "Group" ? "default" : s === "Admin" ? "secondary" : "outline";

  const modifiers = { group: groupDates, admin: adminDates, student: studentDates };
  const modifiersStyles = {
    group: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderRadius: "9999px",
    },
    admin: {
      backgroundColor: "hsl(var(--secondary))",
      color: "hsl(var(--secondary-foreground))",
      borderRadius: "9999px",
    },
    student: {
      backgroundColor: "hsl(var(--accent))",
      color: "hsl(var(--accent-foreground))",
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

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">
            Attended: {totalAttended}/{enrollment?.sessions_total ?? "—"}
          </Badge>
          <Badge variant={sessionsRemaining < 0 ? "destructive" : "secondary"}>
            Remaining: {enrollment?.sessions_remaining ?? sessionsRemaining}
          </Badge>
          {negativeSessions > 0 && (
            <Badge variant="destructive">Negative: {negativeSessions}</Badge>
          )}
          {amountDue > 0 && (
            <Badge variant="destructive">Due: {currLabel}{amountDue.toLocaleString()}</Badge>
          )}
          {isLocked && (
            <Badge variant="destructive" className="flex items-center gap-1 cursor-pointer" onClick={handleUnlock} title="Click to unlock (reset to 0 remaining)">
              <AlertTriangle className="h-3 w-3" /> LOCKED — click to unlock
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enrollment Details */}
        {enrollment && (
          <div className="grid grid-cols-2 gap-2 text-sm border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Plan:</span>
              {editingPlan ? (
                <div className="flex items-center gap-1">
                  <select
                    value={editPlanType}
                    onChange={(e) => setEditPlanType(e.target.value)}
                    className="h-6 text-xs border border-border rounded px-1 bg-background"
                  >
                    <option value="group">group</option>
                    <option value="private">private</option>
                  </select>
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="h-6 text-xs border border-border rounded px-1 bg-background"
                  >
                    <option value="1">1mo</option>
                    <option value="3">3mo</option>
                    <option value="6">6mo</option>
                  </select>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSavePlan} disabled={saving}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingPlan(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{enrollment.plan_type} {enrollment.duration}mo</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => {
                    setEditPlanType(enrollment.plan_type);
                    setEditDuration(String(enrollment.duration));
                    setEditingPlan(true);
                  }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Paid:</span>
              <span className="font-medium">{currLabel}{enrollment.amount.toLocaleString()}</span>
            </div>
            {groupName && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Group:</span>
                <span className="font-medium">{groupName}</span>
              </div>
            )}

            {/* Editable sessions_remaining */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Remaining:</span>
              {editingRemaining ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={editRemaining}
                    onChange={(e) => setEditRemaining(e.target.value)}
                    className="h-6 w-16 text-xs"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveRemaining} disabled={saving}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingRemaining(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{enrollment.sessions_remaining}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => {
                    setEditRemaining(String(enrollment.sessions_remaining));
                    setEditingRemaining(true);
                  }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Editable unit_price */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Unit price:</span>
              {editingUnitPrice ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(e.target.value)}
                    className="h-6 w-20 text-xs"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveUnitPrice} disabled={saving}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingUnitPrice(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{currLabel}{enrollment.unit_price}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => {
                    setEditUnitPrice(String(enrollment.unit_price));
                    setEditingUnitPrice(true);
                  }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

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
          <div className="flex gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Group</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Student</span>
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
              <div key={`${r.source}-${r.id}`} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {new Date(r.session_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <Badge variant={sourceBadgeVariant(r.source)} className="text-[10px] px-1.5 py-0">
                    {r.source === "Group" ? "Group" : r.source === "Admin" ? "Admin" : "Self"}
                  </Badge>
                  {r.group_name && (
                    <span className="text-xs text-muted-foreground">{r.group_name}</span>
                  )}
                </div>
                {/* Only allow deletion of admin-logged records */}
                {r.source === "Admin" && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAttendancePanel;

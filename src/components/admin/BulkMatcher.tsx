import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Zap, XCircle, RefreshCw, Search, ShieldAlert, Ban, ClipboardCheck, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EnrollmentChecklistManager from "./EnrollmentChecklist";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOT_LEVELS = ["Beginner 1", "Beginner 2", "Intermediate 1", "Intermediate 2", "Advanced 1", "Advanced 2"];
const COMMON_TIMEZONES = [
  "Africa/Cairo", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Riyadh",
  "Asia/Kolkata", "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland",
];

interface SlotInfo {
  id: string;
  day: string;
  time: string;
  course_level: string;
  current_count: number;
  max_students: number;
  status: string;
}

interface Student {
  enrollment_id: string;
  user_id: string;
  name: string;
  email: string;
  plan_type: string;
  level: string;
  preferred_days: string[];
  preferred_time: string | null;
  timezone: string | null;
  assigned_slot_id: string | null;
  slot_day: string | null;
  slot_time: string | null;
  slot_level: string | null;
  slot_current_count: number;
  slot_max_students: number;
}

type MatchStatus = "ready" | "mismatch" | "incomplete" | "unmatched" | "capacity";

const getStatus = (s: Student): MatchStatus => {
  if (!s.assigned_slot_id) return "unmatched";
  if (!s.preferred_days || s.preferred_days.length === 0) return "incomplete";
  if (s.slot_current_count >= s.slot_max_students) return "capacity";
  if (s.slot_day && s.preferred_days.includes(s.slot_day)) return "ready";
  return "mismatch";
};

const STATUS_CONFIG: Record<MatchStatus, { label: string; reason: string; color: string }> = {
  ready: { label: "Ready", reason: "Day match", color: "text-primary" },
  mismatch: { label: "Mismatch", reason: "Day mismatch", color: "text-destructive" },
  incomplete: { label: "Incomplete", reason: "No preferences set", color: "text-yellow-600" },
  unmatched: { label: "Unmatched", reason: "No slot assigned", color: "text-muted-foreground" },
  capacity: { label: "Capacity", reason: "Slot is full", color: "text-orange-600" },
};

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResetDone: () => void;
}

const ResetDialog = ({ open, onOpenChange, onResetDone }: ResetDialogProps) => {
  const [password, setPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!password.trim()) {
      toast({ title: "Error", description: "Password is required.", variant: "destructive" });
      return;
    }
    setResetting(true);
    try {
      const { data, error } = await supabase.rpc("reset_platform_data" as any, {
        _reset_password: password,
      });
      if (error) {
        toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Platform Reset", description: String(data) || "Reset completed." });
        onResetDone();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Reset failed.", variant: "destructive" });
    }
    setPassword("");
    setResetting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" /> Full Platform Reset
          </DialogTitle>
          <DialogDescription className="text-destructive font-medium">
            This will delete ALL users, enrollments, and assignments. This action is irreversible.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Only super admins can perform this action. Enter the reset password to proceed.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reset-password">Reset Password</Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Enter reset password…"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={resetting}>Cancel</Button>
          <Button variant="destructive" onClick={handleReset} disabled={resetting || !password.trim()}>
            {resetting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Resetting…</> : "Reset Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BulkMatcher = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editLevels, setEditLevels] = useState<Record<string, string>>({});
  const [editTimezone, setEditTimezone] = useState<{ enrollId: string; tz: string } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from("matching_slots")
      .select("id, day, time, course_level, current_count, max_students, status")
      .order("course_level")
      .order("day");
    if (data) setSlots(data);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);

    // 1. Scoped: only approved + paid enrollments
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_days, preferred_time, timezone")
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID")
      .order("created_at", { ascending: false });

    if (error || !enrollments || enrollments.length === 0) { setStudents([]); setLoading(false); return; }

    const enrollmentIds = enrollments.map(e => e.id);
    const userIds = [...new Set(enrollments.map(e => e.user_id))];

    // 2. Parallel: profiles + preferences scoped by enrollment IDs
    const [profilesRes, prefsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email, level").in("user_id", userIds),
      supabase.from("student_slot_preferences" as any).select("enrollment_id, assigned_slot_id, match_status").in("enrollment_id", enrollmentIds),
    ]);

    const profileMap: Record<string, { name: string; email: string; level: string }> = {};
    profilesRes.data?.forEach(p => { profileMap[p.user_id] = { name: p.name, email: p.email, level: p.level || "" }; });

    const prefMap: Record<string, string> = {};
    (prefsRes.data as any[])?.forEach(p => { if (p.assigned_slot_id) prefMap[p.enrollment_id] = p.assigned_slot_id; });

    // 3. Fetch only used slots
    const slotIds = [...new Set(Object.values(prefMap).filter(Boolean))];
    const slotMap: Record<string, { day: string; time: string; course_level: string; current_count: number; max_students: number }> = {};
    if (slotIds.length > 0) {
      const { data: slotsData } = await supabase
        .from("matching_slots" as any)
        .select("id, day, time, course_level, current_count, max_students")
        .in("id", slotIds);
      (slotsData as any[])?.forEach(s => { slotMap[s.id] = { day: s.day, time: s.time, course_level: s.course_level, current_count: s.current_count, max_students: s.max_students }; });
    }

    const enriched: Student[] = enrollments.map(e => {
      const p = profileMap[e.user_id];
      const slotId = prefMap[e.id] || null;
      const slot = slotId ? slotMap[slotId] : null;
      return {
        enrollment_id: e.id,
        user_id: e.user_id,
        name: p?.name || "Unknown",
        email: p?.email || "",
        plan_type: e.plan_type,
        level: p?.level || "",
        preferred_days: e.preferred_days || [],
        preferred_time: e.preferred_time,
        timezone: e.timezone,
        assigned_slot_id: slotId,
        slot_day: slot?.day || null,
        slot_time: slot?.time || null,
        slot_level: slot?.course_level || null,
        slot_current_count: slot?.current_count || 0,
        slot_max_students: slot?.max_students || 0,
      };
    });

    setStudents(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); fetchSlots(); }, [fetchStudents]);

  const updateStudent = (enrollId: string, patch: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.enrollment_id === enrollId ? { ...s, ...patch } : s));
  };

  // --- RPC-based actions ---
  const handleToggleDay = async (student: Student, day: string) => {
    const newDays = student.preferred_days.includes(day)
      ? student.preferred_days.filter(d => d !== day)
      : [...student.preferred_days, day];

    updateStudent(student.enrollment_id, { preferred_days: newDays });

    const { error } = await supabase.rpc("update_student_preferences" as any, {
      _enrollment_id: student.enrollment_id,
      _preferred_days: newDays,
      _timezone: student.timezone || "",
    });

    if (error) {
      updateStudent(student.enrollment_id, { preferred_days: student.preferred_days });
      toast({ title: "Error", description: error.message || "Failed to update days.", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Preferred days updated for ${student.name}.` });
    }
  };

  const handleTimezoneChange = async (student: Student, newTz: string) => {
    const oldTz = student.timezone;
    updateStudent(student.enrollment_id, { timezone: newTz });
    setEditTimezone(null);

    const { error } = await supabase.rpc("update_student_preferences" as any, {
      _enrollment_id: student.enrollment_id,
      _preferred_days: student.preferred_days,
      _timezone: newTz,
    });

    if (error) {
      updateStudent(student.enrollment_id, { timezone: oldTz });
      toast({ title: "Error", description: error.message || "Failed to update timezone.", variant: "destructive" });
    } else {
      toast({ title: "Timezone updated", description: `${student.name} → ${newTz}` });
    }
  };

  const handleUnmatch = async (student: Student) => {
    if (!student.assigned_slot_id) return;
    const oldSlotId = student.assigned_slot_id;
    setSavingId(student.enrollment_id);

    updateStudent(student.enrollment_id, { assigned_slot_id: null, slot_day: null, slot_time: null, slot_level: null });
    setSlots(prev => prev.map(s => s.id === oldSlotId ? { ...s, current_count: Math.max(0, s.current_count - 1) } : s));

    const { error } = await supabase.rpc("unmatch_student_slot" as any, {
      _enrollment_id: student.enrollment_id,
    });

    if (error) {
      fetchStudents(); fetchSlots();
      toast({ title: "Error", description: error.message || "Failed to unmatch.", variant: "destructive" });
    } else {
      toast({ title: "Unmatched", description: `${student.name} removed from slot.` });
    }
    setSavingId(null);
  };

  const handleReassign = async (student: Student, newSlotId: string) => {
    setSavingId(student.enrollment_id);
    const oldSlotId = student.assigned_slot_id;
    const newSlot = slots.find(s => s.id === newSlotId);
    if (!newSlot) return;

    // Optimistic
    updateStudent(student.enrollment_id, {
      assigned_slot_id: newSlotId,
      slot_day: newSlot.day,
      slot_time: newSlot.time,
      slot_level: newSlot.course_level,
      slot_current_count: newSlot.current_count + 1,
      slot_max_students: newSlot.max_students,
    });
    setSlots(prev => prev.map(s => {
      if (s.id === oldSlotId) return { ...s, current_count: Math.max(0, s.current_count - 1) };
      if (s.id === newSlotId) return { ...s, current_count: s.current_count + 1 };
      return s;
    }));

    const { error } = await supabase.rpc("reassign_student_slot" as any, {
      _enrollment_id: student.enrollment_id,
      _new_slot_id: newSlotId,
    });

    if (error) {
      fetchStudents(); fetchSlots();
      toast({ title: "Error", description: error.message || "Failed to reassign.", variant: "destructive" });
    } else {
      toast({ title: "Reassigned", description: `${student.name} → ${newSlot.day} ${newSlot.time}` });
    }
    setSavingId(null);
  };

  const handleMatchAll = async () => {
    setMatching(true);
    let ok = 0, fail = 0;
    const unmatchedStudents = students.filter(s => !s.assigned_slot_id);

    for (const student of unmatchedStudents) {
      const level = editLevels[student.enrollment_id] || student.level;
      if (!level) { fail++; continue; }
      try {
        if (editLevels[student.enrollment_id]) {
          await supabase.from("profiles").update({ level: editLevels[student.enrollment_id] } as any).eq("user_id", student.user_id);
        }
        const { data: matchedId, error } = await supabase.rpc("match_enrollment_to_slot", { _enrollment_id: student.enrollment_id } as any);
        if (error || !matchedId) fail++; else ok++;
      } catch { fail++; }
    }

    toast({ title: "Bulk Match", description: `${ok} matched, ${fail} failed.` });
    setEditLevels({});
    setMatching(false);
    fetchStudents();
    fetchSlots();
  };

  // --- Filtered & grouped ---
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(s => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [students, search]);

  const ready = useMemo(() => filtered.filter(s => getStatus(s) === "ready"), [filtered]);
  const mismatched = useMemo(() => filtered.filter(s => getStatus(s) === "mismatch"), [filtered]);
  const incomplete = useMemo(() => filtered.filter(s => getStatus(s) === "incomplete"), [filtered]);
  const unmatched = useMemo(() => filtered.filter(s => getStatus(s) === "unmatched"), [filtered]);
  const capacityFull = useMemo(() => filtered.filter(s => getStatus(s) === "capacity"), [filtered]);

  const mismatchByLevelAndType = useMemo(() => {
    const groups: Record<string, Student[]> = {};
    mismatched.forEach(s => {
      const lvl = s.level || "Unknown";
      const type = s.plan_type === "private" ? "Private" : "Group";
      const key = `${lvl} — ${type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [mismatched]);

  const handleChecklistAction = useCallback((_enrollmentId: string, _action: string) => {
    // Actions are now handled inline within the checklist panel
  }, []);

  // Must be before early return to satisfy hooks rules
  const slotGroupsData = useMemo(() => {
    const groups: Record<string, { slot: SlotInfo; students: Student[] }> = {};
    students.forEach(s => {
      if (!s.assigned_slot_id) return;
      const slot = slots.find(sl => sl.id === s.assigned_slot_id);
      if (!slot) return;
      if (!groups[s.assigned_slot_id]) groups[s.assigned_slot_id] = { slot, students: [] };
      groups[s.assigned_slot_id].students.push(s);
    });
    return Object.values(groups).sort((a, b) => {
      const lvl = a.slot.course_level.localeCompare(b.slot.course_level);
      return lvl !== 0 ? lvl : a.slot.day.localeCompare(b.slot.day);
    });
  }, [students, slots]);

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading…</p>;

  const DayChips = ({ student }: { student: Student }) => (
    <div className="flex flex-wrap gap-1">
      {WEEKDAYS.map(day => (
        <button key={day} type="button"
          onClick={() => handleToggleDay(student, day)}
          className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors cursor-pointer ${
            student.preferred_days.includes(day)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border hover:border-primary/50"
          }`}>
          {day.slice(0, 3)}
        </button>
      ))}
    </div>
  );

  const SlotDropdown = ({ student }: { student: Student }) => {
    const level = editLevels[student.enrollment_id] || student.level;
    const available = slots.filter(s => s.course_level === level && s.current_count < s.max_students && s.id !== student.assigned_slot_id);
    return (
      <Select onValueChange={v => handleReassign(student, v)}>
        <SelectTrigger className="h-7 text-xs w-40">
          <SelectValue placeholder="Reassign…" />
        </SelectTrigger>
        <SelectContent>
          {available.map(s => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.day} {s.time} ({s.current_count}/{s.max_students})
            </SelectItem>
          ))}
          {available.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">No slots available</p>}
        </SelectContent>
      </Select>
    );
  };

  const TimezoneCell = ({ student }: { student: Student }) => {
    const isEditing = editTimezone?.enrollId === student.enrollment_id;
    if (isEditing) {
      return (
        <Select
          defaultValue={editTimezone.tz}
          onValueChange={v => handleTimezoneChange(student, v)}
        >
          <SelectTrigger className="h-7 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map(tz => (
              <SelectItem key={tz} value={tz} className="text-xs">{tz.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
        onClick={() => setEditTimezone({ enrollId: student.enrollment_id, tz: student.timezone || "" })}
      >
        {student.timezone?.replace(/_/g, " ") || "Set…"}
      </button>
    );
  };

  const StudentRow = ({ student }: { student: Student }) => {
    const status = getStatus(student);
    const config = STATUS_CONFIG[status];
    return (
      <TableRow>
        <TableCell>
          <p className="font-medium text-foreground text-sm">{student.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{student.email}</p>
        </TableCell>
        <TableCell>
          {status === "unmatched" ? (
            <Select value={editLevels[student.enrollment_id] || student.level || ""}
              onValueChange={v => setEditLevels(prev => ({ ...prev, [student.enrollment_id]: v }))}>
              <SelectTrigger className={`h-7 text-xs w-32 ${!student.level && !editLevels[student.enrollment_id] ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Set level…" />
              </SelectTrigger>
              <SelectContent>
                {SLOT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="text-xs">{student.level}</Badge>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={student.plan_type === "private" ? "secondary" : "outline"} className="text-[10px] capitalize">
            {student.plan_type || "—"}
          </Badge>
        </TableCell>
        <TableCell>
          {student.assigned_slot_id ? (
            <Badge variant={status === "ready" ? "default" : "destructive"} className="text-xs whitespace-nowrap">
              {student.slot_day} {student.slot_time}
            </Badge>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </TableCell>
        <TableCell><DayChips student={student} /></TableCell>
        <TableCell><TimezoneCell student={student} /></TableCell>
        <TableCell>
          <span className={`text-[10px] font-medium ${config.color}`}>{config.reason}</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <SlotDropdown student={student} />
            {student.assigned_slot_id && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                disabled={savingId === student.enrollment_id} onClick={() => handleUnmatch(student)}>
                <XCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const Section = ({ title, icon, students: sectionStudents, variant }: {
    title: string; icon: React.ReactNode; students: Student[];
    variant: "primary" | "destructive" | "muted" | "warning";
  }) => {
    if (sectionStudents.length === 0) return null;
    const borderClass = variant === "primary" ? "border-primary/30" : variant === "destructive" ? "border-destructive/30" : variant === "warning" ? "border-yellow-500/30" : "";
    return (
      <Card className={borderClass}>
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            {icon}
            {title}
            <Badge variant="outline" className="ml-1 text-[10px]">{sectionStudents.length}</Badge>
          </h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Preferred Days</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionStudents.map(s => <StudentRow key={s.enrollment_id} student={s} />)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getSuggestions = (levelStudents: Student[], level: string) => {
    const levelSlots = slots.filter(s => s.course_level === level && s.current_count < s.max_students);
    const scored = levelSlots.map(slot => ({
      slot,
      studentsWhoPrefer: levelStudents.filter(s => s.preferred_days.includes(slot.day)).length,
      available: slot.max_students - slot.current_count,
    })).sort((a, b) => b.studentsWhoPrefer - a.studentsWhoPrefer);
    return scored.slice(0, 3);
  };

  const MismatchLevelGroup = ({ level, levelStudents }: { level: string; levelStudents: Student[] }) => {
    const suggestions = getSuggestions(levelStudents, level);
    const dayCount: Record<string, number> = {};
    levelStudents.forEach(s => s.preferred_days.forEach(d => { dayCount[d] = (dayCount[d] || 0) + 1; }));
    const sortedDays = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold">{level}</Badge>
            <span className="text-xs text-muted-foreground">{levelStudents.length} student{levelStudents.length > 1 ? "s" : ""}</span>
          </div>
          {sortedDays.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>Most preferred:</span>
              {sortedDays.slice(0, 3).map(([day, count]) => (
                <Badge key={day} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {day.slice(0, 3)} ({count}/{levelStudents.length})
                </Badge>
              ))}
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="bg-muted/50 rounded-md p-2 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-medium text-muted-foreground">💡 Best available slots:</span>
            {suggestions.map(({ slot, studentsWhoPrefer, available }) => (
              <div key={slot.id} className="flex items-center gap-1">
                <Badge variant={studentsWhoPrefer > 0 ? "default" : "outline"} className="text-[10px] cursor-default">
                  {slot.day} {slot.time}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {studentsWhoPrefer}/{levelStudents.length} prefer · {available} seats
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Current Slot</TableHead>
                <TableHead>Preferred Days</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levelStudents.map(s => <StudentRow key={s.enrollment_id} student={s} />)}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  // slotGroups is computed before early return as slotGroupsData
  const slotGroups = slotGroupsData;

  // Slot times are stored as Cairo (UTC+2). Convert to student's local tz.
  const convertSlotToLocal = (day: string, slotTime: string, tz: string): string => {
    try {
      const dayMap: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
      const dayOffset = (dayMap[day] || 1) - 1;
      const ref = new Date(Date.UTC(2024, 0, 1 + dayOffset));
      const [h, m] = slotTime.split(":").map(Number);
      ref.setUTCHours(h - 2, m, 0, 0); // Cairo = UTC+2
      const localTime = ref.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
      const localDay = ref.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
      return `${localDay} ${localTime}`;
    } catch { return `${day} ${slotTime}`; }
  };

  const SlotGroupCard = ({ slot, groupStudents }: { slot: SlotInfo; groupStudents: Student[] }) => {
    const timezones = [...new Set(groupStudents.map(s => s.timezone).filter(Boolean))];
    const statusBadge = slot.status === "confirmed"
      ? <Badge className="text-[10px]">Confirmed ✓</Badge>
      : slot.status === "full"
      ? <Badge variant="destructive" className="text-[10px]">Full</Badge>
      : <Badge variant="outline" className="text-[10px]">Open</Badge>;

    return (
      <Card className={slot.status === "confirmed" ? "border-primary/40" : slot.status === "full" ? "border-destructive/30" : ""}>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-semibold">{slot.course_level}</Badge>
            <span className="font-semibold text-foreground">{slot.day} · {slot.time} (Cairo / UTC+2)</span>
            {statusBadge}
            <span className="text-xs text-muted-foreground">{slot.current_count}/{slot.max_students} students</span>
          </div>

          {timezones.length > 0 && (
            <div className="bg-muted/50 rounded-md p-2 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" /> This slot in each student's local timezone:
              </p>
              <div className="flex flex-wrap gap-2">
                {timezones.map(tz => {
                  const localStr = convertSlotToLocal(slot.day, slot.time, tz!);
                  const count = groupStudents.filter(s => s.timezone === tz).length;
                  return (
                    <div key={tz} className="flex items-center gap-1.5 bg-background rounded px-2 py-1 border text-[10px]">
                      <span className="text-muted-foreground">{tz?.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-semibold text-primary">{localStr}</span>
                      <span className="text-muted-foreground">({count} student{count > 1 ? "s" : ""})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Student</TableHead>
                <TableHead className="text-[10px]">Type</TableHead>
                <TableHead className="text-[10px]">Preferred Days</TableHead>
                <TableHead className="text-[10px]">Timezone</TableHead>
                <TableHead className="text-[10px]">Their Local Time</TableHead>
                <TableHead className="text-[10px]">Day Match</TableHead>
                <TableHead className="text-[10px]">Move To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupStudents.map(s => {
                const dayMatch = s.preferred_days.includes(slot.day);
                const localTime = s.timezone ? convertSlotToLocal(slot.day, slot.time, s.timezone) : "—";
                return (
                  <TableRow key={s.enrollment_id}>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{s.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.plan_type === "private" ? "secondary" : "outline"} className="text-[10px] capitalize">{s.plan_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-0.5">
                        {(s.preferred_days || []).map(d => (
                          <Badge key={d} variant={d === slot.day ? "default" : "outline"} className="text-[10px] px-1 py-0">{d.slice(0, 3)}</Badge>
                        ))}
                        {(!s.preferred_days || s.preferred_days.length === 0) && <span className="text-[10px] text-muted-foreground">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground">{s.timezone?.replace(/_/g, " ") || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-semibold text-foreground">{localTime}</span>
                    </TableCell>
                    <TableCell>
                      {dayMatch
                        ? <Badge variant="default" className="text-[10px]">✓ Match</Badge>
                        : <Badge variant="destructive" className="text-[10px]">✗ Mismatch</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <SlotDropdown student={s} />
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
                          disabled={savingId === s.enrollment_id} onClick={() => handleUnmatch(s)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="matcher" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <TabsList>
          <TabsTrigger value="matcher" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Slot Matcher
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Slot Groups
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" /> Enrollment Checklist
          </TabsTrigger>
        </TabsList>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Full Reset
          </Button>
        </div>
      </div>

      <TabsContent value="matcher">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Bulk Slot Matcher</h3>
              <p className="text-sm text-muted-foreground">
                {students.length} total · <span className="text-primary">{ready.length} ready</span> · <span className="text-destructive">{mismatched.length} mismatch</span> · <span className="text-yellow-600">{incomplete.length} incomplete</span> · <span className="text-orange-600">{capacityFull.length} capacity</span> · {unmatched.length} unmatched
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search name/email…" value={search} onChange={e => setSearch(e.target.value)}
                  className="h-8 text-xs pl-7 w-48" />
              </div>
              <Button variant="outline" size="sm" onClick={() => { fetchStudents(); fetchSlots(); }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
              {unmatched.length > 0 && (
                <Button size="sm" onClick={handleMatchAll} disabled={matching}>
                  {matching ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Matching…</> : <><Zap className="h-3.5 w-3.5 mr-1" /> Match All ({unmatched.length})</>}
                </Button>
              )}
            </div>
          </div>

          <Section title="Ready — Day Match" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} students={ready} variant="primary" />
          <Section title="Capacity — Slot Full" icon={<Ban className="h-4 w-4 text-orange-600" />} students={capacityFull} variant="warning" />
          <Section title="Incomplete — No Preferences" icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />} students={incomplete} variant="warning" />

          {mismatched.length > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="pt-4 space-y-4">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Mismatch — Grouped by Level & Type
                  <Badge variant="outline" className="ml-1 text-[10px]">{mismatched.length}</Badge>
                </h4>
                {Object.entries(mismatchByLevelAndType)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([level, levelStudents]) => (
                    <MismatchLevelGroup key={level} level={level} levelStudents={levelStudents as Student[]} />
                  ))}
              </CardContent>
            </Card>
          )}

          <Section title="Unmatched" icon={<Users className="h-4 w-4 text-muted-foreground" />} students={unmatched} variant="muted" />

          {students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No enrolled students found</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="groups">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Slot Groups</h3>
              <p className="text-sm text-muted-foreground">Who is in each slot, their local times, and day match. Reassign or remove students directly.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { fetchStudents(); fetchSlots(); }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
          {slotGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No students matched to slots yet</p>
            </div>
          ) : (
            slotGroups.map(({ slot, students: gs }) => (
              <SlotGroupCard key={slot.id} slot={slot} groupStudents={gs} />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="checklist">
        <EnrollmentChecklistManager onAction={handleChecklistAction} />
      </TabsContent>

      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} onResetDone={() => { fetchStudents(); fetchSlots(); }} />
    </Tabs>
  );
};

export default BulkMatcher;


import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Loader2, CheckCircle2, AlertCircle, Zap, XCircle, RefreshCw, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOT_LEVELS = ["Beginner 1", "Beginner 2", "Intermediate 1", "Intermediate 2", "Advanced 1", "Advanced 2"];

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
}

type MatchStatus = "match" | "mismatch" | "unmatched";

const getStatus = (s: Student): MatchStatus => {
  if (!s.assigned_slot_id) return "unmatched";
  if (s.slot_day && s.preferred_days?.includes(s.slot_day)) return "match";
  return "mismatch";
};

const BulkMatcher = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editLevels, setEditLevels] = useState<Record<string, string>>({});

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
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_days, preferred_time, timezone")
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID")
      .order("created_at", { ascending: false });

    if (error || !enrollments) { setLoading(false); return; }

    const userIds = [...new Set(enrollments.map(e => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email, level")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string; level: string }> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = { name: p.name, email: p.email, level: p.level || "" }; });

    const { data: prefs } = await supabase
      .from("student_slot_preferences" as any)
      .select("enrollment_id, assigned_slot_id, match_status");

    const prefMap: Record<string, string> = {};
    (prefs as any[])?.forEach(p => { if (p.assigned_slot_id) prefMap[p.enrollment_id] = p.assigned_slot_id; });

    const slotIds = [...new Set(Object.values(prefMap).filter(Boolean))];
    const slotMap: Record<string, { day: string; time: string; course_level: string }> = {};
    if (slotIds.length > 0) {
      const { data: slotsData } = await supabase
        .from("matching_slots" as any)
        .select("id, day, time, course_level")
        .in("id", slotIds);
      (slotsData as any[])?.forEach(s => { slotMap[s.id] = { day: s.day, time: s.time, course_level: s.course_level }; });
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
      };
    });

    setStudents(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); fetchSlots(); }, [fetchStudents]);

  // --- Optimistic helpers ---
  const updateStudent = (enrollId: string, patch: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.enrollment_id === enrollId ? { ...s, ...patch } : s));
  };

  // --- Actions ---
  const handleToggleDay = async (student: Student, day: string) => {
    const newDays = student.preferred_days.includes(day)
      ? student.preferred_days.filter(d => d !== day)
      : [...student.preferred_days, day];

    updateStudent(student.enrollment_id, { preferred_days: newDays });

    const { error } = await supabase
      .from("enrollments")
      .update({ preferred_days: newDays } as any)
      .eq("id", student.enrollment_id);

    if (error) {
      updateStudent(student.enrollment_id, { preferred_days: student.preferred_days });
      toast({ title: "Error", description: "Failed to update days.", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Preferred days updated for ${student.name}.` });
    }
  };

  const handleUnmatch = async (student: Student) => {
    if (!student.assigned_slot_id) return;
    const oldSlotId = student.assigned_slot_id;
    setSavingId(student.enrollment_id);

    updateStudent(student.enrollment_id, { assigned_slot_id: null, slot_day: null, slot_time: null, slot_level: null });
    setSlots(prev => prev.map(s => s.id === oldSlotId ? { ...s, current_count: Math.max(0, s.current_count - 1) } : s));

    try {
      await supabase.from("student_slot_preferences" as any)
        .update({ assigned_slot_id: null, match_status: "pending" } as any)
        .eq("enrollment_id", student.enrollment_id);
      await supabase.from("matching_slots" as any)
        .update({ current_count: Math.max(0, (slots.find(s => s.id === oldSlotId)?.current_count || 1) - 1) } as any)
        .eq("id", oldSlotId);
      toast({ title: "Unmatched", description: `${student.name} removed from slot.` });
    } catch {
      fetchStudents(); fetchSlots();
      toast({ title: "Error", description: "Failed to unmatch.", variant: "destructive" });
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
    });
    setSlots(prev => prev.map(s => {
      if (s.id === oldSlotId) return { ...s, current_count: Math.max(0, s.current_count - 1) };
      if (s.id === newSlotId) return { ...s, current_count: s.current_count + 1 };
      return s;
    }));

    try {
      if (oldSlotId) {
        const oldSlot = slots.find(s => s.id === oldSlotId);
        if (oldSlot) await supabase.from("matching_slots" as any).update({ current_count: Math.max(0, oldSlot.current_count - 1) } as any).eq("id", oldSlotId);
      }
      await supabase.from("matching_slots" as any).update({ current_count: newSlot.current_count + 1 } as any).eq("id", newSlotId);

      const { data: existingPref } = await supabase.from("student_slot_preferences" as any).select("id").eq("enrollment_id", student.enrollment_id).maybeSingle();
      if (existingPref) {
        await supabase.from("student_slot_preferences" as any).update({ assigned_slot_id: newSlotId, match_status: "matched" } as any).eq("enrollment_id", student.enrollment_id);
      } else {
        await supabase.from("student_slot_preferences" as any).insert({ user_id: student.user_id, enrollment_id: student.enrollment_id, selected_level: student.level, slot_1_id: newSlotId, assigned_slot_id: newSlotId, match_status: "matched" } as any);
      }
      toast({ title: "Reassigned", description: `${student.name} → ${newSlot.day} ${newSlot.time}` });
    } catch {
      fetchStudents(); fetchSlots();
      toast({ title: "Error", description: "Failed to reassign.", variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleMatchAll = async () => {
    setMatching(true);
    let ok = 0, fail = 0;
    const unmatched = students.filter(s => !s.assigned_slot_id);

    for (const student of unmatched) {
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

  const matched = useMemo(() => filtered.filter(s => getStatus(s) === "match"), [filtered]);
  const mismatched = useMemo(() => filtered.filter(s => getStatus(s) === "mismatch"), [filtered]);
  const unmatched = useMemo(() => filtered.filter(s => getStatus(s) === "unmatched"), [filtered]);

  const mismatchByLevel = useMemo(() => {
    const groups: Record<string, Student[]> = {};
    mismatched.forEach(s => {
      const lvl = s.level || "Unknown";
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(s);
    });
    return groups;
  }, [mismatched]);

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

  const StudentRow = ({ student }: { student: Student }) => {
    const status = getStatus(student);
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
          {student.assigned_slot_id ? (
            <Badge variant={status === "match" ? "default" : "destructive"} className="text-xs whitespace-nowrap">
              {student.slot_day} {student.slot_time}
            </Badge>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </TableCell>
        <TableCell><DayChips student={student} /></TableCell>
        <TableCell className="text-xs text-muted-foreground">{student.timezone?.replace(/_/g, " ") || "—"}</TableCell>
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
    variant: "primary" | "destructive" | "muted";
  }) => {
    if (sectionStudents.length === 0) return null;
    const borderClass = variant === "primary" ? "border-primary/30" : variant === "destructive" ? "border-destructive/30" : "";
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
                  <TableHead>Slot</TableHead>
                  <TableHead>Preferred Days</TableHead>
                  <TableHead>Timezone</TableHead>
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
    // Count how many students prefer each day
    const dayCount: Record<string, number> = {};
    levelStudents.forEach(s => {
      s.preferred_days.forEach(d => { dayCount[d] = (dayCount[d] || 0) + 1; });
    });
    // Find slots that match the most preferred days
    const scored = levelSlots.map(slot => ({
      slot,
      studentsWhoPrefer: levelStudents.filter(s => s.preferred_days.includes(slot.day)).length,
      available: slot.max_students - slot.current_count,
    })).sort((a, b) => b.studentsWhoPrefer - a.studentsWhoPrefer);
    return scored.slice(0, 3);
  };

  const MismatchLevelGroup = ({ level, levelStudents }: { level: string; levelStudents: Student[] }) => {
    const suggestions = getSuggestions(levelStudents, level);
    // Find common preferred days
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
                <Badge
                  variant={studentsWhoPrefer > 0 ? "default" : "outline"}
                  className="text-[10px] cursor-default"
                >
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
                <TableHead>Current Slot</TableHead>
                <TableHead>Preferred Days</TableHead>
                <TableHead>Timezone</TableHead>
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Bulk Slot Matcher</h3>
          <p className="text-sm text-muted-foreground">
            {students.length} total · <span className="text-primary">{matched.length} matched</span> · <span className="text-destructive">{mismatched.length} mismatch</span> · {unmatched.length} unmatched
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

      {/* Sections */}
      <Section title="Match — Ready" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} students={matched} variant="primary" />

      {/* Mismatch — grouped by level with suggestions */}
      {mismatched.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 space-y-4">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Mismatch — Grouped by Level
              <Badge variant="outline" className="ml-1 text-[10px]">{mismatched.length}</Badge>
            </h4>
            {Object.entries(mismatchByLevel)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([level, students]) => (
                <MismatchLevelGroup key={level} level={level} levelStudents={students} />
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
  );
};

export default BulkMatcher;

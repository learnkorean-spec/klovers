import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Loader2, CheckCircle2, AlertCircle, Zap, XCircle, RefreshCw, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SLOT_LEVELS = ["Beginner 1", "Beginner 2", "Intermediate 1", "Intermediate 2", "Advanced 1", "Advanced 2"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface SlotInfo {
  id: string;
  day: string;
  time: string;
  course_level: string;
  current_count: number;
  max_students: number;
  status: string;
}

interface EnrolledStudent {
  enrollment_id: string;
  user_id: string;
  name: string;
  email: string;
  plan_type: string;
  level: string;
  preferred_days: string[] | null;
  preferred_time: string | null;
  timezone: string | null;
  matched_slot_id: string | null;
  matched_slot_info: string | null;
  slot_day: string | null;
  slot_time: string | null;
  slot_level: string | null;
  match_status: string | null;
  day_matches: boolean;
}

const BulkMatcher = () => {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [editLevels, setEditLevels] = useState<Record<string, string>>({});
  const [editDays, setEditDays] = useState<Record<string, string[]>>({});
  const [editSlots, setEditSlots] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from("matching_slots")
      .select("id, day, time, course_level, current_count, max_students, status")
      .order("course_level")
      .order("day");
    if (data) setSlots(data);
  };

  const fetchStudents = async () => {
    setLoading(true);

    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_days, preferred_time, timezone")
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch enrollments:", error);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((enrollments as any[]).map((e: any) => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email, level")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string; level: string }> = {};
    if (profiles) {
      (profiles as any[]).forEach((p: any) => {
        profileMap[p.user_id] = { name: p.name, email: p.email, level: p.level || "" };
      });
    }

    const { data: prefs } = await supabase
      .from("student_slot_preferences" as any)
      .select("enrollment_id, assigned_slot_id, match_status");

    const prefMap: Record<string, { slot_id: string; match_status: string }> = {};
    if (prefs) {
      (prefs as any[]).forEach((p: any) => {
        if (p.assigned_slot_id) prefMap[p.enrollment_id] = { slot_id: p.assigned_slot_id, match_status: p.match_status };
      });
    }

    const slotIds = [...new Set(Object.values(prefMap).map(v => v.slot_id).filter(Boolean))];
    const slotMap: Record<string, { day: string; time: string; course_level: string }> = {};
    if (slotIds.length > 0) {
      const { data: slotsData } = await supabase
        .from("matching_slots" as any)
        .select("id, day, time, course_level")
        .in("id", slotIds);
      if (slotsData) {
        (slotsData as any[]).forEach((s: any) => {
          slotMap[s.id] = { day: s.day, time: s.time, course_level: s.course_level };
        });
      }
    }

    const enriched: EnrolledStudent[] = (enrollments as any[]).map((e: any) => {
      const p = profileMap[e.user_id];
      const pref = prefMap[e.id];
      const matchedSlotId = pref?.slot_id || null;
      const slotInfo = matchedSlotId ? slotMap[matchedSlotId] : null;
      const preferredDays = e.preferred_days || [];
      const dayMatches = slotInfo ? preferredDays.includes(slotInfo.day) : false;

      return {
        enrollment_id: e.id,
        user_id: e.user_id,
        name: p?.name || "Unknown",
        email: p?.email || "",
        plan_type: e.plan_type,
        level: p?.level || "",
        preferred_days: e.preferred_days,
        preferred_time: e.preferred_time,
        timezone: e.timezone,
        matched_slot_id: matchedSlotId,
        matched_slot_info: slotInfo ? `${slotInfo.day} ${slotInfo.time} (${slotInfo.course_level})` : null,
        slot_day: slotInfo?.day || null,
        slot_time: slotInfo?.time || null,
        slot_level: slotInfo?.course_level || null,
        match_status: pref?.match_status || null,
        day_matches: dayMatches,
      };
    });

    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); fetchSlots(); }, []);

  const toggleDay = (enrollId: string, day: string) => {
    setEditDays((prev) => {
      const current = prev[enrollId] || [];
      return {
        ...prev,
        [enrollId]: current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
      };
    });
  };

  const handleUnmatch = async (student: EnrolledStudent) => {
    if (!student.matched_slot_id) return;
    setSavingId(student.enrollment_id);
    try {
      // Remove slot assignment
      await supabase
        .from("student_slot_preferences" as any)
        .update({ assigned_slot_id: null, match_status: "pending" } as any)
        .eq("enrollment_id", student.enrollment_id);

      // Decrement slot count
      await supabase
        .from("matching_slots" as any)
        .update({ current_count: Math.max(0, (slots.find(s => s.id === student.matched_slot_id)?.current_count || 1) - 1) } as any)
        .eq("id", student.matched_slot_id);

      toast({ title: "Unmatched", description: `${student.name} has been unmatched from their slot.` });
      fetchStudents();
      fetchSlots();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to unmatch student.", variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleReassign = async (student: EnrolledStudent, newSlotId: string) => {
    setSavingId(student.enrollment_id);
    try {
      // If already matched, decrement old slot
      if (student.matched_slot_id) {
        const oldSlot = slots.find(s => s.id === student.matched_slot_id);
        if (oldSlot) {
          await supabase
            .from("matching_slots" as any)
            .update({ current_count: Math.max(0, oldSlot.current_count - 1) } as any)
            .eq("id", student.matched_slot_id);
        }
      }

      // Assign new slot
      const newSlot = slots.find(s => s.id === newSlotId);
      if (newSlot) {
        await supabase
          .from("matching_slots" as any)
          .update({ current_count: newSlot.current_count + 1 } as any)
          .eq("id", newSlotId);
      }

      // Update or insert preference
      const { data: existingPref } = await supabase
        .from("student_slot_preferences" as any)
        .select("id")
        .eq("enrollment_id", student.enrollment_id)
        .maybeSingle();

      if (existingPref) {
        await supabase
          .from("student_slot_preferences" as any)
          .update({ assigned_slot_id: newSlotId, match_status: "matched" } as any)
          .eq("enrollment_id", student.enrollment_id);
      } else {
        await supabase
          .from("student_slot_preferences" as any)
          .insert({
            user_id: student.user_id,
            enrollment_id: student.enrollment_id,
            selected_level: student.level,
            slot_1_id: newSlotId,
            assigned_slot_id: newSlotId,
            match_status: "matched",
          } as any);
      }

      toast({ title: "Reassigned", description: `${student.name} reassigned to new slot.` });
      fetchStudents();
      fetchSlots();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to reassign.", variant: "destructive" });
    }
    setSavingId(null);
    setEditSlots(prev => { const n = { ...prev }; delete n[student.enrollment_id]; return n; });
  };

  const handleMatchAll = async () => {
    setMatching(true);
    let matchCount = 0;
    let failCount = 0;

    const unmatched = students.filter((s) => !s.matched_slot_id);

    for (const student of unmatched) {
      try {
        const editedLevel = editLevels[student.enrollment_id];
        const editedDaysArr = editDays[student.enrollment_id];
        const finalLevel = editedLevel || student.level;

        if (!finalLevel) { failCount++; continue; }

        if (editedLevel) {
          await supabase.from("profiles").update({ level: editedLevel } as any).eq("user_id", student.user_id);
        }
        if (editedDaysArr && editedDaysArr.length > 0) {
          await supabase.from("enrollments").update({ preferred_days: editedDaysArr } as any).eq("id", student.enrollment_id);
        }

        const { data: matchedSlotId, error: matchErr } = await supabase
          .rpc("match_enrollment_to_slot", { _enrollment_id: student.enrollment_id } as any);

        if (matchErr) { console.error(`Match error for ${student.name}:`, matchErr); failCount++; }
        else if (matchedSlotId) { matchCount++; }
        else { failCount++; }
      } catch (err) { console.error(`Error matching ${student.name}:`, err); failCount++; }
    }

    toast({ title: "Bulk Match Complete", description: `${matchCount} matched, ${failCount} could not be matched.` });
    setEditLevels({});
    setEditDays({});
    setMatching(false);
    fetchStudents();
    fetchSlots();
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading enrolled students...</p>;
  }

  const unmatched = students.filter((s) => !s.matched_slot_id);
  const matched = students.filter((s) => s.matched_slot_id);
  const readyForConfirmation = matched.filter(s => s.day_matches);
  const mismatchedDays = matched.filter(s => !s.day_matches);

  const DayPills = ({ enrollId, currentDays, editable = true }: { enrollId: string; currentDays: string[]; editable?: boolean }) => (
    <div className="flex flex-wrap gap-1">
      {WEEKDAYS.map((day) => (
        <button
          key={day}
          type="button"
          disabled={!editable}
          onClick={() => editable && toggleDay(enrollId, day)}
          className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
            currentDays.includes(day)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border hover:border-primary/50"
          } ${!editable ? "opacity-70 cursor-default" : "cursor-pointer"}`}
        >
          {day.slice(0, 3)}
        </button>
      ))}
    </div>
  );

  const SlotSelector = ({ student }: { student: EnrolledStudent }) => {
    const level = editLevels[student.enrollment_id] || student.level;
    const availableSlots = slots.filter(s => s.course_level === level && s.current_count < s.max_students);
    const editingSlot = editSlots[student.enrollment_id];

    return (
      <div className="flex items-center gap-2">
        <Select
          value={editingSlot || ""}
          onValueChange={(v) => setEditSlots(prev => ({ ...prev, [student.enrollment_id]: v }))}
        >
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder="Reassign slot..." />
          </SelectTrigger>
          <SelectContent>
            {availableSlots.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.day} {s.time} ({s.current_count}/{s.max_students})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {editingSlot && (
          <Button size="sm" variant="outline" className="h-7 text-xs"
            disabled={savingId === student.enrollment_id}
            onClick={() => handleReassign(student, editingSlot)}>
            {savingId === student.enrollment_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        )}
      </div>
    );
  };

  const MatchedStudentRow = ({ s }: { s: EnrolledStudent }) => {
    const currentDays = editDays[s.enrollment_id] || s.preferred_days || [];

    return (
      <TableRow key={s.enrollment_id}>
        <TableCell>
          <div>
            <p className="font-medium text-foreground text-sm">{s.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{s.email}</p>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">{s.level}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={s.day_matches ? "default" : "destructive"} className="text-xs whitespace-nowrap">
            {s.slot_day} {s.slot_time}
          </Badge>
          {s.day_matches ? (
            <p className="text-[10px] text-primary mt-0.5">✓ Day matches</p>
          ) : (
            <p className="text-[10px] text-destructive mt-0.5">✗ Day mismatch</p>
          )}
        </TableCell>
        <TableCell>
          <DayPills enrollId={s.enrollment_id} currentDays={currentDays} editable={true} />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">{s.timezone?.replace(/_/g, " ") || "—"}</TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <SlotSelector student={s} />
            <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive hover:text-destructive"
              disabled={savingId === s.enrollment_id}
              onClick={() => handleUnmatch(s)}>
              <XCircle className="h-3 w-3 mr-1" /> Unmatch
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Bulk Slot Matcher</h3>
          <p className="text-sm text-muted-foreground">
            {students.length} enrolled — {matched.length} matched ({readyForConfirmation.length} ready, {mismatchedDays.length} day mismatch), {unmatched.length} unmatched
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { fetchStudents(); fetchSlots(); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {unmatched.length > 0 && (
            <Button size="sm" onClick={handleMatchAll} disabled={matching}>
              {matching ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Matching...</> : <><Zap className="h-4 w-4 mr-2" /> Match All ({unmatched.length})</>}
            </Button>
          )}
        </div>
      </div>

      {/* Ready for Confirmation */}
      {readyForConfirmation.length > 0 && (
        <Card className="border-primary/30">
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Ready for Confirmation Email ({readyForConfirmation.length})
              <Badge variant="outline" className="ml-2 text-[10px]">Day matches slot</Badge>
            </h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Assigned Slot</TableHead>
                    <TableHead>Preferred Days</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readyForConfirmation.map((s) => <MatchedStudentRow key={s.enrollment_id} s={s} />)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Mismatch */}
      {mismatchedDays.length > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Day Mismatch — Needs Review ({mismatchedDays.length})
            </h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Assigned Slot</TableHead>
                    <TableHead>Preferred Days</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatchedDays.map((s) => <MatchedStudentRow key={s.enrollment_id} s={s} />)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmatched students */}
      {unmatched.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Unmatched Students ({unmatched.length})
            </h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Preferred Days</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Timezone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmatched.map((s) => {
                    const currentLevel = editLevels[s.enrollment_id] || s.level;
                    const currentDays = editDays[s.enrollment_id] || s.preferred_days || [];
                    const missingLevel = !currentLevel;

                    return (
                      <TableRow key={s.enrollment_id} className={missingLevel ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{s.plan_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentLevel || ""}
                            onValueChange={(v) => setEditLevels((prev) => ({ ...prev, [s.enrollment_id]: v }))}
                          >
                            <SelectTrigger className={`h-8 text-xs w-36 ${missingLevel ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Set level..." />
                            </SelectTrigger>
                            <SelectContent>
                              {SLOT_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <DayPills enrollId={s.enrollment_id} currentDays={currentDays} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.preferred_time || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.timezone?.replace(/_/g, " ") || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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

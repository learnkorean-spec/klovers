import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SLOT_LEVELS = ["Beginner 1", "Beginner 2", "Intermediate 1", "Intermediate 2", "Advanced 1", "Advanced 2"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
}

const BulkMatcher = () => {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [editLevels, setEditLevels] = useState<Record<string, string>>({});
  const [editDays, setEditDays] = useState<Record<string, string[]>>({});

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

    // Get existing slot preferences (matched students)
    const { data: prefs } = await supabase
      .from("student_slot_preferences" as any)
      .select("enrollment_id, assigned_slot_id, match_status");

    const prefMap: Record<string, string | null> = {};
    if (prefs) {
      (prefs as any[]).forEach((p: any) => {
        if (p.assigned_slot_id) prefMap[p.enrollment_id] = p.assigned_slot_id;
      });
    }

    // Get slot details for matched students
    const slotIds = [...new Set(Object.values(prefMap).filter(Boolean))] as string[];
    const slotMap: Record<string, string> = {};
    if (slotIds.length > 0) {
      const { data: slots } = await supabase
        .from("matching_slots" as any)
        .select("id, day, time, course_level")
        .in("id", slotIds);
      if (slots) {
        (slots as any[]).forEach((s: any) => {
          slotMap[s.id] = `${s.day} ${s.time} (${s.course_level})`;
        });
      }
    }

    const enriched: EnrolledStudent[] = (enrollments as any[]).map((e: any) => {
      const p = profileMap[e.user_id];
      const matchedSlotId = prefMap[e.id] || null;
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
        matched_slot_info: matchedSlotId ? slotMap[matchedSlotId] || "Matched" : null,
      };
    });

    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const toggleDay = (enrollId: string, day: string) => {
    setEditDays((prev) => {
      const current = prev[enrollId] || [];
      return {
        ...prev,
        [enrollId]: current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
      };
    });
  };

  const handleMatchAll = async () => {
    // Save any edited levels/days first, then run matcher on all unmatched
    setMatching(true);
    let matchCount = 0;
    let failCount = 0;

    const unmatched = students.filter((s) => !s.matched_slot_id);

    for (const student of unmatched) {
      try {
        const editedLevel = editLevels[student.enrollment_id];
        const editedDaysArr = editDays[student.enrollment_id];
        const finalLevel = editedLevel || student.level;

        if (!finalLevel) {
          failCount++;
          continue; // Skip students without level
        }

        // Save level to profile if edited
        if (editedLevel) {
          await supabase.from("profiles").update({ level: editedLevel } as any).eq("user_id", student.user_id);
        }

        // Save days to enrollment if edited
        if (editedDaysArr && editedDaysArr.length > 0) {
          await supabase.from("enrollments").update({ preferred_days: editedDaysArr } as any).eq("id", student.enrollment_id);
        }

        // Run matcher
        const { data: matchedSlotId, error: matchErr } = await supabase
          .rpc("match_enrollment_to_slot", { _enrollment_id: student.enrollment_id } as any);

        if (matchErr) {
          console.error(`Match error for ${student.name}:`, matchErr);
          failCount++;
        } else if (matchedSlotId) {
          matchCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Error matching ${student.name}:`, err);
        failCount++;
      }
    }

    toast({
      title: "Bulk Match Complete",
      description: `${matchCount} matched, ${failCount} could not be matched (missing level or no available slot).`,
    });

    setEditLevels({});
    setEditDays({});
    setMatching(false);
    fetchStudents();
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading enrolled students...</p>;
  }

  const unmatched = students.filter((s) => !s.matched_slot_id);
  const matched = students.filter((s) => s.matched_slot_id);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Bulk Slot Matcher</h3>
          <p className="text-sm text-muted-foreground">
            {students.length} enrolled students — {matched.length} matched, {unmatched.length} unmatched
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStudents}>Refresh</Button>
          {unmatched.length > 0 && (
            <Button size="sm" onClick={handleMatchAll} disabled={matching}>
              {matching ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Matching...</> : <><Zap className="h-4 w-4 mr-2" /> Match All Unmatched ({unmatched.length})</>}
            </Button>
          )}
        </div>
      </div>

      {/* Unmatched students */}
      {unmatched.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
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
                    const missingDays = currentDays.length === 0;

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
                          <div className="flex flex-wrap gap-1">
                            {WEEKDAYS.map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(s.enrollment_id, day)}
                                className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                                  currentDays.includes(day)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                                }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            ))}
                          </div>
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

      {/* Matched students */}
      {matched.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Matched Students ({matched.length})
            </h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Assigned Slot</TableHead>
                    <TableHead>Preferred Days</TableHead>
                    <TableHead>Timezone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matched.map((s) => (
                    <TableRow key={s.enrollment_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.plan_type}</Badge></TableCell>
                      <TableCell className="text-sm">{s.level || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">{s.matched_slot_info}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.preferred_days?.join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.timezone?.replace(/_/g, " ") || "—"}</TableCell>
                    </TableRow>
                  ))}
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

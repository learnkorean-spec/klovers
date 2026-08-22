/**
 * "My Students" — Re's ongoing 1:1 students and their weekly classes.
 *
 * These are private students, not people registered on kloversegy.com; the
 * existing Students tab covers those. What makes this screen matter is that
 * every class here blocks that time for trials automatically — the availability
 * engine reads these rows directly, so moving a class moves the trial slots in
 * the same instant.
 *
 * A class that runs past midnight is ONE class, stored as one row
 * (start + duration) and shown as one line. It is never split into two entries.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock, Loader2, GraduationCap } from "lucide-react";
import { ADMIN_TIMEZONE } from "@/constants/scheduling";
import {
  useMyStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  useUpsertClass, useDeleteClass,
} from "@/hooks/admin/useMyStudents";
import {
  DAY_NAMES, STATUS_LABEL, STUDENT_STATUSES, STUDENT_SUBJECTS, SUBJECT_LABEL,
  crossesMidnight, formatClassRange, formatWeeklySummary, weeklyMinutes,
  type MyStudentWithClasses, type StudentClassSchedule,
  type StudentStatus, type StudentSubject,
} from "@/types/students";

const SUBJECT_BADGE: Record<StudentSubject, string> = {
  korean: "bg-yellow-100 text-yellow-900 border-yellow-300",
  english: "bg-sky-100 text-sky-900 border-sky-300",
};

const STATUS_BADGE: Record<StudentStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  ended: "bg-gray-100 text-gray-600",
};

/** 30-minute options across the day, matching the trial grid. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 105, 120, 150, 180];

type StudentDraft = { id?: string; full_name: string; subject: StudentSubject; status: StudentStatus; note: string };
type ClassDraft = { id?: string; student_id: string; weekday: number; start_time: string; duration_minutes: number };

const emptyStudent = (): StudentDraft => ({ full_name: "", subject: "korean", status: "active", note: "" });

/** Postgres returns "22:00:00"; the picker works in "22:00". */
const trimSeconds = (t: string) => t.slice(0, 5);

const MyStudentsManager = () => {
  const { data: students = [], isLoading } = useMyStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const upsertClass = useUpsertClass();
  const deleteClass = useDeleteClass();

  const [studentDraft, setStudentDraft] = useState<StudentDraft | null>(null);
  const [classDraft, setClassDraft] = useState<ClassDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MyStudentWithClasses | null>(null);

  const totals = useMemo(() => {
    const active = students.filter(s => s.status === "active");
    const mins = active.reduce((sum, s) => sum + weeklyMinutes(s.classes), 0);
    return { active: active.length, hours: (mins / 60).toFixed(1) };
  }, [students]);

  const saveStudent = async () => {
    if (!studentDraft) return;
    if (!studentDraft.full_name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const payload = {
      full_name: studentDraft.full_name,
      subject: studentDraft.subject,
      status: studentDraft.status,
      note: studentDraft.note.trim() || null,
    };
    try {
      if (studentDraft.id) await updateStudent.mutateAsync({ id: studentDraft.id, ...payload });
      else await createStudent.mutateAsync(payload);
      toast({ title: studentDraft.id ? "Student updated" : "Student added" });
      setStudentDraft(null);
    } catch (e) {
      toast({ title: "Could not save student", description: (e as Error).message, variant: "destructive" });
    }
  };

  const saveClass = async () => {
    if (!classDraft) return;
    try {
      await upsertClass.mutateAsync(classDraft);
      toast({
        title: classDraft.id ? "Class updated" : "Class added",
        description: "Trial availability has been updated to match.",
      });
      setClassDraft(null);
    } catch (e) {
      toast({ title: "Could not save class", description: (e as Error).message, variant: "destructive" });
    }
  };

  const removeClass = async (c: StudentClassSchedule) => {
    try {
      await deleteClass.mutateAsync(c.id);
      toast({ title: "Class removed", description: "That time is now open for trials." });
    } catch (e) {
      toast({ title: "Could not remove class", description: (e as Error).message, variant: "destructive" });
    }
  };

  const removeStudent = async () => {
    if (!confirmDelete) return;
    try {
      await deleteStudent.mutateAsync(confirmDelete.id);
      toast({ title: "Student removed", description: "Their class times are now open for trials." });
      setConfirmDelete(null);
    } catch (e) {
      toast({ title: "Could not remove student", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> My Students
            </CardTitle>
            <CardDescription>
              Your ongoing private students. Their classes block that time for trials
              automatically — all times are your own ({ADMIN_TIMEZONE.replace(/_/g, " ")}).
            </CardDescription>
          </div>
          <Button onClick={() => setStudentDraft(emptyStudent())}>
            <Plus className="h-4 w-4 mr-1" /> Add student
          </Button>
        </div>
        {!isLoading && (
          <p className="text-xs text-muted-foreground pt-1">
            {totals.active} active · {totals.hours} teaching hours a week
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
          </div>
        )}

        {!isLoading && students.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">
            No students yet. Add one and their weekly classes will be kept clear of trials.
          </p>
        )}

        {students.map(student => (
          <div key={student.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{student.full_name}</span>
                <Badge variant="outline" className={SUBJECT_BADGE[student.subject]}>
                  {SUBJECT_LABEL[student.subject]}
                </Badge>
                {student.status !== "active" && (
                  <Badge className={STATUS_BADGE[student.status]}>{STATUS_LABEL[student.status]}</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setStudentDraft({
                    id: student.id,
                    full_name: student.full_name,
                    subject: student.subject,
                    status: student.status,
                    note: student.note ?? "",
                  })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(student)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{formatWeeklySummary(student.classes)}</p>

            <div className="space-y-1.5">
              {student.classes.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium w-24">{DAY_NAMES[c.weekday]}</span>
                    <span>{formatClassRange(trimSeconds(c.start_time), c.duration_minutes)}</span>
                    {crossesMidnight(trimSeconds(c.start_time), c.duration_minutes) && (
                      // One class, one row. The badge explains the "+1 day" above
                      // so it never reads as two separate classes.
                      <Badge variant="outline" className="text-[10px]">runs past midnight</Badge>
                    )}
                  </span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setClassDraft({
                        id: c.id,
                        student_id: student.id,
                        weekday: c.weekday,
                        start_time: trimSeconds(c.start_time),
                        duration_minutes: c.duration_minutes,
                      })}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeClass(c)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </span>
                </div>
              ))}
              <Button
                variant="outline" size="sm"
                onClick={() => setClassDraft({
                  student_id: student.id, weekday: 1, start_time: "19:00", duration_minutes: 90,
                })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add a class
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Student dialog */}
      <Dialog open={!!studentDraft} onOpenChange={o => !o && setStudentDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{studentDraft?.id ? "Edit student" : "Add student"}</DialogTitle>
            <DialogDescription>
              Name and subject for now. Contact details and payments come later.
            </DialogDescription>
          </DialogHeader>
          {studentDraft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="student-name">Name</Label>
                <Input
                  id="student-name" value={studentDraft.full_name}
                  onChange={e => setStudentDraft({ ...studentDraft, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Learning</Label>
                <Select
                  value={studentDraft.subject}
                  onValueChange={v => setStudentDraft({ ...studentDraft, subject: v as StudentSubject })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STUDENT_SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{SUBJECT_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={studentDraft.status}
                  onValueChange={v => setStudentDraft({ ...studentDraft, status: v as StudentStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STUDENT_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only active students block trial times. Pausing frees their slots without losing the schedule.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-note">Note (optional)</Label>
                <Input
                  id="student-note" value={studentDraft.note}
                  onChange={e => setStudentDraft({ ...studentDraft, note: e.target.value })}
                  placeholder="Only you can see this"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDraft(null)}>Cancel</Button>
            <Button onClick={saveStudent} disabled={createStudent.isPending || updateStudent.isPending}>
              {(createStudent.isPending || updateStudent.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class dialog */}
      <Dialog open={!!classDraft} onOpenChange={o => !o && setClassDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{classDraft?.id ? "Edit class" : "Add a class"}</DialogTitle>
            <DialogDescription>
              Weekly, in your own time. Saving updates your trial availability straight away.
            </DialogDescription>
          </DialogHeader>
          {classDraft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select
                  value={String(classDraft.weekday)}
                  onValueChange={v => setClassDraft({ ...classDraft, weekday: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Starts</Label>
                  <Select
                    value={classDraft.start_time}
                    onValueChange={v => setClassDraft({ ...classDraft, start_time: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Length</Label>
                  <Select
                    value={String(classDraft.duration_minutes)}
                    onValueChange={v => setClassDraft({ ...classDraft, duration_minutes: Number(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(d => (
                        <SelectItem key={d} value={String(d)}>
                          {d < 60 ? `${d} min` : `${d / 60} hr${d > 60 ? "s" : ""}`.replace(".5", "½")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                {DAY_NAMES[classDraft.weekday]}{" "}
                <strong>{formatClassRange(classDraft.start_time, classDraft.duration_minutes)}</strong>
                {crossesMidnight(classDraft.start_time, classDraft.duration_minutes) && (
                  <span className="block text-xs text-muted-foreground pt-1">
                    This class runs past midnight. It stays one class — you don't need to add a second one.
                  </span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassDraft(null)}>Cancel</Button>
            <Button onClick={saveClass} disabled={upsertClass.isPending}>
              {upsertClass.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the student and all their classes. Those times immediately
              become bookable for trials. To keep the schedule but free the time,
              set the student to Paused instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeStudent}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MyStudentsManager;

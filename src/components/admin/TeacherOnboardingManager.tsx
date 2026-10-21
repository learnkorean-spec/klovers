/**
 * Teacher Onboarding — roster of teachers plus, per teacher, a checklist
 * tracked against every course level the platform offers (hangul, l1..l6 —
 * see src/constants/levels.ts).
 *
 * This is new ground: every other teacher-shaped table in this codebase
 * (teacher_availability, teacher_students, ...) is scoped to the single
 * current teacher. This screen is the admin's view of a growing roster —
 * add a teacher, see what's left before they're ready to teach each course,
 * and check steps off as they happen.
 *
 * A teacher is not required to have a login yet (`teachers.user_id` is
 * nullable) — onboarding can start before an account exists. See the
 * migration's own header comment for the rest of the data-model rationale.
 */
import { useMemo, useState } from "react";
import {
  GraduationCap, Plus, Trash2, Pencil, Loader2, UserPlus, AlertCircle, Mail, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LEVELS, getLevelShortLabel } from "@/constants/levels";
import {
  ALL_COURSE_KEYS, useAssignCourse, useCreateTeacher, useDeleteTeacher,
  useOnboardingSteps, useRemoveCourse, useTeachers, useToggleStep, useUpdateCourseStatus,
  useUpdateTeacher, type TeacherInput,
} from "@/hooks/admin/useTeacherOnboarding";
import {
  COURSE_PROGRESS_STATUS_LABEL, GENERAL_SCOPE_KEY, TEACHER_STATUS_LABEL,
  type CourseProgressStatus, type OnboardingProgress, type OnboardingStep,
  type TeacherStatus, type TeacherWithOnboarding,
} from "@/types/teacherOnboarding";

/** A friendlier message for the Postgres errors this screen can actually hit. */
function friendlyError(e: any): string {
  if (e?.code === "23505") return "A teacher with this email already exists.";
  return e?.message ?? "Something went wrong.";
}

/** One checklist line: English title, with the Arabic title underneath for readers who prefer it. */
function StepCheckbox({
  step, progress, onToggle,
}: {
  step: OnboardingStep;
  progress: OnboardingProgress | undefined;
  onToggle: (next: boolean) => void;
}) {
  const done = progress?.is_done ?? false;
  return (
    <label className="flex items-start gap-2 text-sm py-0.5">
      <Checkbox checked={done} onCheckedChange={(c) => onToggle(!!c)} className="mt-0.5" />
      <span className="flex flex-col">
        <span className={done ? "line-through text-muted-foreground" : ""}>{step.title_en}</span>
        {step.title_ar && (
          <span dir="rtl" className={`text-[11px] ${done ? "text-muted-foreground/60 line-through" : "text-muted-foreground"}`}>
            {step.title_ar}
          </span>
        )}
      </span>
    </label>
  );
}

const STATUS_BADGE: Record<TeacherStatus, string> = {
  onboarding: "bg-amber-100 text-amber-800 border-amber-300",
  active: "bg-green-100 text-green-800 border-green-300",
  paused: "bg-gray-100 text-gray-700 border-gray-300",
  offboarded: "bg-red-100 text-red-700 border-red-300",
};

const COURSE_STATUS_BADGE: Record<CourseProgressStatus, string> = {
  not_started: "bg-gray-100 text-gray-600 border-gray-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  ready: "bg-sky-100 text-sky-800 border-sky-300",
  active: "bg-green-100 text-green-800 border-green-300",
};

const EMPTY_DRAFT: TeacherInput = { full_name: "", email: "", phone: "", status: "onboarding", notes: "" };

/** `LEVELS` order (hangul, l1..l6) applied to a set of course keys. */
function sortByLevelOrder(keys: string[]): string[] {
  const order = new Map(LEVELS.map((l, i) => [l.key, i]));
  return [...keys].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

function TeacherDialog({
  open, onOpenChange, draft, onSave, saving, isEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: TeacherInput & { courseKeys?: string[] };
  onSave: (draft: TeacherInput, courseKeys: string[]) => void;
  saving: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState(draft);
  const [courseKeys, setCourseKeys] = useState<string[]>(draft.courseKeys ?? ALL_COURSE_KEYS);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setForm(draft);
          setCourseKeys(draft.courseKeys ?? ALL_COURSE_KEYS);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit teacher" : "Add teacher"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this teacher's details."
              : "By default a new teacher starts onboarding toward every course the platform offers — uncheck any they won't teach."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Teacher's full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teacher@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone (optional)</Label>
            <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 1xx xxx xxxx" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TeacherStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TEACHER_STATUS_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything worth remembering about this teacher"
              rows={2}
            />
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Courses to onboard toward</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-2.5">
                {LEVELS.map((l) => (
                  <label key={l.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={courseKeys.includes(l.key)}
                      onCheckedChange={(c) =>
                        setCourseKeys((prev) => (c ? [...prev, l.key] : prev.filter((k) => k !== l.key)))
                      }
                    />
                    {l.shortLabel}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={saving || !form.full_name.trim() || !form.email.trim()}
            onClick={() => onSave(form, courseKeys)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save" : "Add teacher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherOnboardingManager() {
  const { user } = useAuth();
  const { data: teachers = [], isLoading, error } = useTeachers();
  const { data: steps = [] } = useOnboardingSteps();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const assignCourse = useAssignCourse();
  const removeCourse = useRemoveCourse();
  const updateCourseStatus = useUpdateCourseStatus();
  const toggleStep = useToggleStep();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TeacherStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeacherWithOnboarding | null>(null);
  const [addCourseKey, setAddCourseKey] = useState<string>("");
  /** `teacherId:courseLevelKey` awaiting a second click before it actually removes. */
  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);

  const generalSteps = useMemo(() => steps.filter((s) => s.scope === "general"), [steps]);
  const perCourseSteps = useMemo(() => steps.filter((s) => s.scope === "per_course"), [steps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.full_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
    });
  }, [teachers, search, statusFilter]);

  const selected = useMemo(() => teachers.find((t) => t.id === selectedId) ?? null, [teachers, selectedId]);

  function overallProgress(t: TeacherWithOnboarding) {
    const total = t.stepProgress.length;
    const done = t.stepProgress.filter((p) => p.is_done).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  async function handleCreate(input: TeacherInput, courseKeys: string[]) {
    try {
      const res = await createTeacher.mutateAsync({ input, courseKeys });
      toast({ title: "Teacher added", description: `${input.full_name} is now onboarding.` });
      setAddOpen(false);
      setSelectedId(res.id);
    } catch (e: any) {
      toast({ title: "Couldn't add teacher", description: friendlyError(e), variant: "destructive" });
    }
  }

  async function handleUpdate(input: TeacherInput) {
    if (!selected) return;
    try {
      await updateTeacher.mutateAsync({ id: selected.id, ...input });
      toast({ title: "Saved" });
      setEditOpen(false);
    } catch (e: any) {
      toast({ title: "Couldn't save", description: friendlyError(e), variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTeacher.mutateAsync(deleteTarget.id);
      toast({ title: "Teacher removed" });
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch (e: any) {
      toast({ title: "Couldn't remove teacher", description: friendlyError(e), variant: "destructive" });
    }
  }

  async function handleToggle(teacherId: string, stepId: string, courseLevelKey: string, next: boolean) {
    try {
      await toggleStep.mutateAsync({ teacherId, stepId, courseLevelKey, isDone: next, completedBy: user?.id ?? null });
    } catch (e: any) {
      toast({ title: "Couldn't update step", description: friendlyError(e), variant: "destructive" });
    }
  }

  /**
   * Toggles one per-course step, then — if that completes every per-course
   * step for this course and nobody has put it further along already — bumps
   * the course from not_started/in_progress to ready. Never touches 'active':
   * that is always the admin's own call, not something a checklist earns on
   * its own.
   */
  async function handleTogglePerCourse(
    teacherId: string,
    courseKey: string,
    stepId: string,
    next: boolean,
    currentCourseProgress: TeacherWithOnboarding["courseProgress"][number],
    currentCourseSteps: OnboardingProgress[],
  ) {
    await handleToggle(teacherId, stepId, courseKey, next);
    if (!next) return;
    if (currentCourseProgress.status !== "not_started" && currentCourseProgress.status !== "in_progress") return;
    const willAllBeDone = perCourseSteps.every((s) => {
      if (s.id === stepId) return true;
      return currentCourseSteps.find((p) => p.step_id === s.id)?.is_done ?? false;
    });
    if (!willAllBeDone) return;
    try {
      await updateCourseStatus.mutateAsync({ teacherId, courseLevelKey: courseKey, status: "ready" });
      toast({ title: "Checklist complete", description: `${getLevelShortLabel(courseKey)} marked ready to teach.` });
    } catch {
      /* non-critical convenience bump — the checklist itself already saved */
    }
  }

  async function handleAddCourse(teacherId: string) {
    if (!addCourseKey) return;
    try {
      await assignCourse.mutateAsync({ teacherId, courseLevelKey: addCourseKey });
      setAddCourseKey("");
    } catch (e: any) {
      toast({ title: "Couldn't add course", description: friendlyError(e), variant: "destructive" });
    }
  }

  async function handleRemoveCourse(teacherId: string, courseLevelKey: string) {
    const key = `${teacherId}:${courseLevelKey}`;
    if (confirmRemoveKey !== key) {
      setConfirmRemoveKey(key);
      return;
    }
    setConfirmRemoveKey(null);
    try {
      await removeCourse.mutateAsync({ teacherId, courseLevelKey });
    } catch (e: any) {
      toast({ title: "Couldn't remove course", description: friendlyError(e), variant: "destructive" });
    }
  }

  // Schema not deployed yet (relation missing) — surfaces as a specific
  // Postgres error code rather than crashing the tab. See the migration's
  // own note and docs/APPLYING_MIGRATIONS.md: this repo never auto-applies
  // migrations, so this is an expected, actionable state, not a bug.
  const schemaMissing = (error as any)?.code === "42P01";
  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-10 text-center space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          {schemaMissing ? (
            <>
              <p className="text-sm font-medium">Teacher onboarding tables aren't live yet.</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                The migration is committed (supabase/migrations/20261021050526_teacher_onboarding.sql) but not yet
                applied — run the "Apply Migrations" GitHub Action (mode: apply) to turn this screen on.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{(error as any).message}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Teacher Onboarding</h2>
          <p className="text-sm text-muted-foreground">Track every teacher's readiness across every course level.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" /> Add teacher</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Roster */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3 space-y-2">
            <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(TEACHER_STATUS_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
            {!isLoading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {teachers.length === 0 ? "No teachers yet — add the first one." : "No teachers match your filters."}
              </p>
            )}
            {filtered.map((t) => {
              const { done, total, pct } = overallProgress(t);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                    selectedId === t.id ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{t.full_name}</span>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_BADGE[t.status]}`}>
                      {TEACHER_STATUS_LABEL[t.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground shrink-0">{done}/{total}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Detail */}
        <Card className="rounded-2xl">
          {!selected ? (
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Select a teacher to see their onboarding checklist.
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {selected.full_name}
                    <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[selected.status]}`}>
                      {TEACHER_STATUS_LABEL[selected.status]}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selected.email}</span>
                    {selected.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selected.phone}</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget(selected)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected.notes && <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">{selected.notes}</p>}

                {/* General steps — once per teacher, not tied to a course */}
                {generalSteps.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">General onboarding</Label>
                    <div className="space-y-1 rounded-lg border p-2.5">
                      {generalSteps.map((step) => {
                        const progress = selected.stepProgress.find(
                          (p) => p.step_id === step.id && p.course_level_key === GENERAL_SCOPE_KEY,
                        );
                        return (
                          <StepCheckbox
                            key={step.id}
                            step={step}
                            progress={progress}
                            onToggle={(next) => handleToggle(selected.id, step.id, GENERAL_SCOPE_KEY, next)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Per-course checklists */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Courses</Label>
                    {(() => {
                      const assigned = new Set(selected.courseProgress.map((c) => c.course_level_key));
                      const available = LEVELS.filter((l) => !assigned.has(l.key));
                      if (available.length === 0) return null;
                      return (
                        <div className="flex items-center gap-1.5">
                          <Select value={addCourseKey} onValueChange={setAddCourseKey}>
                            <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Add a course…" /></SelectTrigger>
                            <SelectContent>
                              {available.map((l) => <SelectItem key={l.key} value={l.key}>{l.shortLabel}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            disabled={!addCourseKey || assignCourse.isPending}
                            onClick={() => handleAddCourse(selected.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })()}
                  </div>

                  {selected.courseProgress.length === 0 ? (
                    <p className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
                      No courses assigned yet — add one above to start this teacher's onboarding.
                    </p>
                  ) : (
                    <Accordion type="multiple" className="space-y-1.5" defaultValue={sortByLevelOrder(selected.courseProgress.map((c) => c.course_level_key)).slice(0, 1)}>
                      {sortByLevelOrder(selected.courseProgress.map((c) => c.course_level_key)).map((courseKey) => {
                        const cp = selected.courseProgress.find((c) => c.course_level_key === courseKey)!;
                        const courseStepProgress = selected.stepProgress.filter((p) => p.course_level_key === courseKey);
                        const done = courseStepProgress.filter((p) => p.is_done).length;
                        const total = perCourseSteps.length;
                        return (
                          <AccordionItem key={courseKey} value={courseKey} className="border rounded-lg px-3">
                            <AccordionTrigger className="py-2.5 hover:no-underline">
                              <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                                <span className="font-medium text-sm">{getLevelShortLabel(courseKey)}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] ${COURSE_STATUS_BADGE[cp.status]}`}>
                                    {COURSE_PROGRESS_STATUS_LABEL[cp.status]}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">{done}/{total}</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2.5 pb-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs shrink-0">Status</Label>
                                <Select
                                  value={cp.status}
                                  onValueChange={(v) =>
                                    updateCourseStatus.mutate({ teacherId: selected.id, courseLevelKey: courseKey, status: v as CourseProgressStatus })
                                  }
                                >
                                  <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(COURSE_PROGRESS_STATUS_LABEL).map(([v, label]) => (
                                      <SelectItem key={v} value={v}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                {perCourseSteps.map((step) => {
                                  const progress = courseStepProgress.find((p) => p.step_id === step.id);
                                  return (
                                    <StepCheckbox
                                      key={step.id}
                                      step={step}
                                      progress={progress}
                                      onToggle={(next) =>
                                        handleTogglePerCourse(selected.id, courseKey, step.id, next, cp, courseStepProgress)
                                      }
                                    />
                                  );
                                })}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive px-2"
                                onClick={() => handleRemoveCourse(selected.id, courseKey)}
                                onBlur={() => setConfirmRemoveKey((k) => (k === `${selected.id}:${courseKey}` ? null : k))}
                              >
                                {confirmRemoveKey === `${selected.id}:${courseKey}` ? "Click again to confirm" : "Remove this course"}
                              </Button>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <TeacherDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        draft={EMPTY_DRAFT}
        saving={createTeacher.isPending}
        isEdit={false}
        onSave={handleCreate}
      />
      {selected && (
        <TeacherDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          draft={{ full_name: selected.full_name, email: selected.email, phone: selected.phone ?? "", status: selected.status, notes: selected.notes ?? "" }}
          saving={updateTeacher.isPending}
          isEdit
          onSave={handleUpdate}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes their roster entry and all onboarding progress. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteTeacher.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

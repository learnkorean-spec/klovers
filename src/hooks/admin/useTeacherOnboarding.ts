/**
 * Data access for the teacher onboarding system — the admin-only roster of
 * teachers and, per teacher, a checklist tracked against every course level
 * the platform offers (see src/constants/levels.ts for the canonical list
 * and supabase/migrations/20261021050526_teacher_onboarding.sql for the
 * schema this reads/writes).
 *
 * Nothing here touches teacher_availability, teacher_students or any of the
 * tables already scoped to the single current teacher — this is a separate,
 * additive system for onboarding teachers (plural) as the roster grows.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LEVEL_KEYS } from "@/constants/levels";
import {
  GENERAL_SCOPE_KEY,
  type CourseProgressStatus,
  type OnboardingProgress,
  type OnboardingStep,
  type Teacher,
  type TeacherCourseProgress,
  type TeacherStatus,
  type TeacherWithOnboarding,
} from "@/types/teacherOnboarding";

const KEYS = {
  teachers: ["admin", "teacher-onboarding", "teachers"] as const,
  steps: ["admin", "teacher-onboarding", "steps"] as const,
};

/** Every course level a newly-added teacher is, by default, onboarded toward. */
export const ALL_COURSE_KEYS: string[] = [...LEVEL_KEYS];

function invalidateTeachers(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEYS.teachers });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** The shared checklist catalogue — rarely changes, fetched once and cached. */
export function useOnboardingSteps() {
  return useQuery<OnboardingStep[]>({
    queryKey: KEYS.steps,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_onboarding_steps")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as OnboardingStep[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeachers() {
  return useQuery<TeacherWithOnboarding[]>({
    queryKey: KEYS.teachers,
    queryFn: async () => {
      const [{ data: teachers, error: tErr }, { data: courseRows, error: cErr }, { data: stepRows, error: sErr }] =
        await Promise.all([
          supabase.from("teachers").select("*").order("full_name"),
          supabase.from("teacher_course_progress").select("*"),
          supabase.from("teacher_onboarding_progress").select("*"),
        ]);
      if (tErr) throw tErr;
      if (cErr) throw cErr;
      if (sErr) throw sErr;

      const courseByTeacher = new Map<string, TeacherCourseProgress[]>();
      for (const c of (courseRows ?? []) as TeacherCourseProgress[]) {
        const list = courseByTeacher.get(c.teacher_id) ?? [];
        list.push(c);
        courseByTeacher.set(c.teacher_id, list);
      }
      const stepsByTeacher = new Map<string, OnboardingProgress[]>();
      for (const s of (stepRows ?? []) as OnboardingProgress[]) {
        const list = stepsByTeacher.get(s.teacher_id) ?? [];
        list.push(s);
        stepsByTeacher.set(s.teacher_id, list);
      }

      return ((teachers ?? []) as Teacher[]).map((t) => ({
        ...t,
        courseProgress: courseByTeacher.get(t.id) ?? [],
        stepProgress: stepsByTeacher.get(t.id) ?? [],
      }));
    },
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Internal: instantiate checklist rows for a teacher/course pair
// ---------------------------------------------------------------------------

/**
 * Makes sure every GENERAL step has a progress row for this teacher, and
 * every PER_COURSE step has a progress row for each of `courseKeys`. Safe to
 * call repeatedly — `ignoreDuplicates` means existing (possibly completed)
 * rows are left untouched; this only ever adds rows that are missing.
 *
 * This is what both "create a teacher" (all courses) and "assign one more
 * course to an existing teacher" (iteration 4's edge case) share.
 */
async function ensureOnboardingRows(teacherId: string, courseKeys: string[]) {
  const { data: steps, error: stepsErr } = await supabase
    .from("teacher_onboarding_steps")
    .select("id, scope")
    .eq("is_active", true);
  if (stepsErr) throw stepsErr;

  const generalStepIds = (steps ?? []).filter((s) => s.scope === "general").map((s) => s.id);
  const perCourseStepIds = (steps ?? []).filter((s) => s.scope === "per_course").map((s) => s.id);

  const rows: { teacher_id: string; step_id: string; course_level_key: string }[] = [];
  for (const stepId of generalStepIds) {
    rows.push({ teacher_id: teacherId, step_id: stepId, course_level_key: GENERAL_SCOPE_KEY });
  }
  for (const courseKey of courseKeys) {
    for (const stepId of perCourseStepIds) {
      rows.push({ teacher_id: teacherId, step_id: stepId, course_level_key: courseKey });
    }
  }
  if (rows.length === 0) return;

  const { error: upsertErr } = await supabase
    .from("teacher_onboarding_progress")
    .upsert(rows, { onConflict: "teacher_id,step_id,course_level_key", ignoreDuplicates: true });
  if (upsertErr) throw upsertErr;
}

async function ensureCourseProgressRows(teacherId: string, courseKeys: string[]) {
  if (courseKeys.length === 0) return;
  const rows = courseKeys.map((course_level_key) => ({
    teacher_id: teacherId,
    course_level_key,
    status: "not_started" as CourseProgressStatus,
  }));
  const { error } = await supabase
    .from("teacher_course_progress")
    .upsert(rows, { onConflict: "teacher_id,course_level_key", ignoreDuplicates: true });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Writes: teacher roster
// ---------------------------------------------------------------------------

export interface TeacherInput {
  full_name: string;
  email: string;
  phone?: string | null;
  status: TeacherStatus;
  notes?: string | null;
}

/** Creates a teacher and, by default, starts onboarding for every course the platform offers. */
export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, courseKeys = ALL_COURSE_KEYS }: { input: TeacherInput; courseKeys?: string[] }) => {
      const { data, error } = await supabase
        .from("teachers")
        .insert({ ...input, full_name: input.full_name.trim(), email: input.email.trim().toLowerCase() })
        .select("id")
        .single();
      if (error) throw error;
      await ensureCourseProgressRows(data.id, courseKeys);
      await ensureOnboardingRows(data.id, courseKeys);
      return data;
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TeacherInput & { id: string }) => {
      const { error } = await supabase
        .from("teachers")
        .update({ ...input, full_name: input.full_name.trim(), email: input.email.trim().toLowerCase() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // teacher_course_progress and teacher_onboarding_progress both cascade
      // on teacher_id, so this is the only statement needed.
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

// ---------------------------------------------------------------------------
// Writes: course assignment
// ---------------------------------------------------------------------------

/** Assigns one more course to an existing teacher (e.g. a course added after onboarding started). */
export function useAssignCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teacherId, courseLevelKey }: { teacherId: string; courseLevelKey: string }) => {
      await ensureCourseProgressRows(teacherId, [courseLevelKey]);
      await ensureOnboardingRows(teacherId, [courseLevelKey]);
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

/** Removes a course a teacher was never actually going to teach — drops its checklist rows too. */
export function useRemoveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teacherId, courseLevelKey }: { teacherId: string; courseLevelKey: string }) => {
      const { error: progressErr } = await supabase
        .from("teacher_onboarding_progress")
        .delete()
        .eq("teacher_id", teacherId)
        .eq("course_level_key", courseLevelKey);
      if (progressErr) throw progressErr;
      const { error: courseErr } = await supabase
        .from("teacher_course_progress")
        .delete()
        .eq("teacher_id", teacherId)
        .eq("course_level_key", courseLevelKey);
      if (courseErr) throw courseErr;
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

export function useUpdateCourseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherId,
      courseLevelKey,
      status,
    }: {
      teacherId: string;
      courseLevelKey: string;
      status: CourseProgressStatus;
    }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "in_progress") patch.started_at = new Date().toISOString();
      if (status === "ready") patch.ready_at = new Date().toISOString();
      const { error } = await supabase
        .from("teacher_course_progress")
        .update(patch)
        .eq("teacher_id", teacherId)
        .eq("course_level_key", courseLevelKey);
      if (error) throw error;
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

// ---------------------------------------------------------------------------
// Writes: checklist steps
// ---------------------------------------------------------------------------

export function useToggleStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherId,
      stepId,
      courseLevelKey,
      isDone,
      completedBy,
    }: {
      teacherId: string;
      stepId: string;
      courseLevelKey: string;
      isDone: boolean;
      completedBy: string | null;
    }) => {
      const { error } = await supabase
        .from("teacher_onboarding_progress")
        .update({
          is_done: isDone,
          completed_at: isDone ? new Date().toISOString() : null,
          completed_by: isDone ? completedBy : null,
        })
        .eq("teacher_id", teacherId)
        .eq("step_id", stepId)
        .eq("course_level_key", courseLevelKey);
      if (error) throw error;
    },
    onSuccess: () => invalidateTeachers(qc),
  });
}

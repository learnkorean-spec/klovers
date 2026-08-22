/**
 * Data access for Re's ongoing 1:1 students and their weekly classes.
 *
 * Editing a class here changes trial availability immediately: the availability
 * engine reads student_class_schedules directly as a source of blocks, so there
 * is nothing to sync and nothing that can drift out of step.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  MyStudent,
  MyStudentWithClasses,
  StudentClassSchedule,
  StudentStatus,
  StudentSubject,
} from "@/types/students";

const KEYS = {
  all: ["admin", "my-students"] as const,
};

/** Availability is derived from these rows, so any edit invalidates it too. */
function invalidateStudentsAndAvailability(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEYS.all });
  qc.invalidateQueries({ queryKey: ["admin", "trial-availability"] });
}

export function useMyStudents() {
  return useQuery<MyStudentWithClasses[]>({
    queryKey: KEYS.all,
    queryFn: async () => {
      const [{ data: students, error: sErr }, { data: classes, error: cErr }] =
        await Promise.all([
          supabase
            .from("students")
            .select("id, full_name, subject, status, note, created_at, updated_at")
            .order("full_name"),
          supabase
            .from("student_class_schedules")
            .select("id, student_id, weekday, start_time, duration_minutes, timezone, effective_from, effective_to, note")
            .is("effective_to", null)
            .order("weekday")
            .order("start_time"),
        ]);

      if (sErr) throw sErr;
      if (cErr) throw cErr;

      const byStudent = new Map<string, StudentClassSchedule[]>();
      for (const c of (classes ?? []) as StudentClassSchedule[]) {
        const list = byStudent.get(c.student_id) ?? [];
        list.push(c);
        byStudent.set(c.student_id, list);
      }

      return ((students ?? []) as MyStudent[]).map(s => ({
        ...s,
        classes: byStudent.get(s.id) ?? [],
      }));
    },
    staleTime: 60 * 1000,
  });
}

export interface StudentInput {
  full_name: string;
  subject: StudentSubject;
  status: StudentStatus;
  note?: string | null;
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const { data, error } = await supabase
        .from("students")
        .insert({ ...input, full_name: input.full_name.trim() })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateStudentsAndAvailability(qc),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StudentInput & { id: string }) => {
      const { error } = await supabase
        .from("students")
        .update({ ...input, full_name: input.full_name.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateStudentsAndAvailability(qc),
  });
}

/**
 * Deleting a student removes their classes too (ON DELETE CASCADE), which frees
 * the time for trials. The UI confirms before calling this.
 */
export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateStudentsAndAvailability(qc),
  });
}

/** A live trial booking that a proposed class time would collide with. */
export interface ClassConflict {
  booking_id: string;
  booked_name: string;
  booked_email: string;
  starts_at: string;
}

/**
 * Which booked trials would this class time run over?
 *
 * Called before saving so the admin sees a readable message naming the
 * booking, rather than the database exception. The database refuses the write
 * regardless — this is the courtesy, not the guarantee.
 */
export async function checkClassConflicts(input: {
  weekday: number;
  start_time: string;
  duration_minutes: number;
}): Promise<ClassConflict[]> {
  const { data, error } = await supabase.rpc("fn_student_class_conflicts", {
    p_weekday: input.weekday,
    p_start_time: input.start_time,
    p_duration_minutes: input.duration_minutes,
  });
  if (error) throw error;
  return (data ?? []) as ClassConflict[];
}

export interface ClassInput {
  student_id: string;
  weekday: number;
  /** "HH:MM" from the time input. */
  start_time: string;
  duration_minutes: number;
}

export function useUpsertClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ClassInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase
          .from("student_class_schedules")
          .update(input)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("student_class_schedules")
        .insert({ ...input, timezone: "Asia/Kuala_Lumpur" });
      if (error) throw error;
    },
    onSuccess: () => invalidateStudentsAndAvailability(qc),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_class_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateStudentsAndAvailability(qc),
  });
}

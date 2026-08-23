/**
 * Data access for Re's ongoing 1:1 students and their weekly classes.
 *
 * Editing a class here changes trial availability immediately: the availability
 * engine reads teacher_student_classes directly as a source of blocks, so there
 * is nothing to sync and nothing that can drift out of step.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  BundleBalance,
  BundleSource,
  BundleStatus,
  MyStudent,
  MyStudentWithClasses,
  SessionOutcome,
  StudentBundle,
  StudentClassSchedule,
  StudentClassSession,
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
            .from("teacher_students")
            .select("id, full_name, subject, status, note, meeting_url, country, currency, created_at, updated_at")
            .order("full_name"),
          supabase
            .from("teacher_student_classes")
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
  /** Empty string from the form becomes NULL — the CHECK only allows https:// or nothing. */
  meeting_url?: string | null;
  country?: string | null;
  currency?: string | null;
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const { data, error } = await supabase
        .from("teacher_students")
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
        .from("teacher_students")
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
      const { error } = await supabase.from("teacher_students").delete().eq("id", id);
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
          .from("teacher_student_classes")
          .update(input)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("teacher_student_classes")
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
      const { error } = await supabase.from("teacher_student_classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateStudentsAndAvailability(qc),
  });
}

// ---------------------------------------------------------------------------
// Bundles and credits.
//
// The balance is never stored. get_student_bundle_balances() counts confirmed
// sessions against the active bundle, so nothing here has to keep a running
// total in step — which is exactly the failure mode the legacy students table
// still demonstrates.
// ---------------------------------------------------------------------------

const BUNDLE_KEYS = {
  balances: ["admin", "student-bundles"] as const,
  sessions: ["admin", "student-sessions"] as const,
};

function invalidateCredits(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: BUNDLE_KEYS.balances });
  qc.invalidateQueries({ queryKey: BUNDLE_KEYS.sessions });
}

/** Active bundle + counted usage, keyed by student. Students with no active bundle are absent. */
export function useBundleBalances() {
  return useQuery<Map<string, BundleBalance>>({
    queryKey: BUNDLE_KEYS.balances,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_student_bundle_balances");
      if (error) throw error;
      return new Map(((data ?? []) as BundleBalance[]).map(b => [b.student_id, b]));
    },
    staleTime: 30 * 1000,
  });
}

/** Every bundle a student has ever had, newest first — the payment history. */
export function useStudentBundles(studentId: string | null) {
  return useQuery<StudentBundle[]>({
    queryKey: [...BUNDLE_KEYS.balances, "history", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_bundles")
        .select("id, student_id, source, catalog_key, label, total_classes, total_price, currency, purchased_on, status, note")
        .eq("student_id", studentId!)
        .order("purchased_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentBundle[];
    },
  });
}

/**
 * Every confirmed session for one student, all time, newest first.
 *
 * Separate from useRecentSessions on purpose: the confirm strip only needs a
 * fortnight, but the history is where a mistake from three weeks ago gets
 * corrected, so it must not be windowed.
 */
export function useAllStudentSessions(studentId: string | null) {
  return useQuery<StudentClassSession[]>({
    queryKey: [...BUNDLE_KEYS.sessions, "all", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_class_sessions")
        .select("id, student_id, bundle_id, class_id, session_date, start_time, outcome, counted, confirmed_at, note")
        .eq("student_id", studentId!)
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentClassSession[];
    },
  });
}

/**
 * Confirmed sessions across all students within the catch-up window. Loaded in
 * one query rather than per student: the window is short and the rows are tiny,
 * and one round trip keeps the confirm strip from flickering student by student.
 */
export function useRecentSessions(sinceDate: string) {
  return useQuery<StudentClassSession[]>({
    queryKey: [...BUNDLE_KEYS.sessions, sinceDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_class_sessions")
        .select("id, student_id, bundle_id, class_id, session_date, start_time, outcome, counted, confirmed_at, note")
        .gte("session_date", sinceDate)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentClassSession[];
    },
    staleTime: 30 * 1000,
  });
}

export interface BundleInput {
  student_id: string;
  source: BundleSource;
  catalog_key: string | null;
  label: string;
  total_classes: number;
  total_price: number;
  currency: string;
  note?: string | null;
}

/**
 * Adds a bundle. Any existing active bundle for that student is completed first,
 * because the database allows only one active at a time — doing it here means Re
 * adds a renewal without a separate "close the old one" step.
 */
export function useAddBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BundleInput) => {
      const { error: closeErr } = await supabase
        .from("student_bundles")
        .update({ status: "completed" })
        .eq("student_id", input.student_id)
        .eq("status", "active");
      if (closeErr) throw closeErr;

      const { error } = await supabase.from("student_bundles").insert(input);
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

export function useUpdateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<BundleInput> & { id: string; status?: BundleStatus }) => {
      const { error } = await supabase.from("student_bundles").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

export interface ConfirmSessionInput {
  student_id: string;
  bundle_id: string;
  class_id: string | null;
  session_date: string;
  start_time: string;
  outcome: SessionOutcome;
}

/**
 * Confirms one or many sessions in a single insert.
 *
 * A single insert is the batch guarantee: Postgres applies it as one statement,
 * so a batch containing a day that is already confirmed is refused whole by
 * uq_student_class_sessions_slot and nothing is partially applied. The UI never
 * has to reason about which half of a catch-up landed.
 */
export function useConfirmSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: ConfirmSessionInput[]) => {
      if (rows.length === 0) return;
      const { error } = await supabase.from("student_class_sessions").insert(
        rows.map(r => ({ ...r, counted: r.outcome === "attended" })),
      );
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

/** Undo. Deleting the row is the whole correction — the balance is recounted. */
export function useUnconfirmSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_class_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

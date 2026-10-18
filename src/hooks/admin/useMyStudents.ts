/**
 * Data access for Re's ongoing 1:1 students and their weekly classes.
 *
 * Editing a class here changes trial availability immediately: the availability
 * engine reads teacher_student_classes directly as a source of blocks, so there
 * is nothing to sync and nothing that can drift out of step.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TIMEZONE } from "@/constants/scheduling";
import {
  localDateKey,
  type BundleBalance,
  type BundleEdit,
  type BundleSource,
  type BundleStatus,
  type MyStudent,
  type MyStudentWithClasses,
  type SessionOutcome,
  type StudentBundle,
  type StudentClassSchedule,
  type StudentClassSession,
  type StudentStatus,
  type StudentSubject,
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
  /** "YYYY-MM-DD". Catch up and the confirm strip never offer a date before this. */
  effective_from: string;
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
        // The page states every class time is the teacher's own clock
        // (ADMIN_TIMEZONE, Bangkok). Labelling new rows Kuala_Lumpur put each
        // new class an hour off; all 10 existing rows are Asia/Bangkok.
        .insert({ ...input, timezone: TIMEZONE });
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
  upcoming: ["admin", "student-sessions", "upcoming"] as const,
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

const BUNDLE_COLUMNS =
  "id, student_id, source, catalog_key, label, total_classes, total_price, currency, " +
  "purchased_on, paid_on, coverage_start, coverage_start_confirmed_at, status, voided_reason, voided_at, note";

const SESSION_COLUMNS =
  "id, student_id, bundle_id, class_id, session_date, start_time, outcome, counted, confirmed_at, note";

/** Every bundle a student has ever had, newest first — the payment history. */
export function useStudentBundles(studentId: string | null) {
  return useQuery<StudentBundle[]>({
    queryKey: [...BUNDLE_KEYS.balances, "history", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_bundles")
        .select(BUNDLE_COLUMNS)
        .eq("student_id", studentId!)
        .order("purchased_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentBundle[];
    },
  });
}

/**
 * Every bundle for every student, any status, in one query — keyed by student.
 * The confirm and catch-up flows resolve a session's bundle by date across a
 * student's WHOLE bundle history (see resolveBundleForDate), not just the
 * active one, so they need this rather than useBundleBalances.
 *
 * Ordered even though resolveBundleForDate no longer depends on input order --
 * an unordered SELECT feeding a resolver is a latent bug on its own, the exact
 * shape of the one that mis-resolved a real session to a superseded bundle.
 * The next person reading this should not have to know it is safe by
 * accident.
 */
export function useAllBundles() {
  return useQuery<Map<string, StudentBundle[]>>({
    queryKey: [...BUNDLE_KEYS.balances, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_bundles")
        .select(BUNDLE_COLUMNS)
        .order("coverage_start", { ascending: false });
      if (error) throw error;
      const map = new Map<string, StudentBundle[]>();
      for (const row of (data ?? []) as StudentBundle[]) {
        const list = map.get(row.student_id) ?? [];
        list.push(row);
        map.set(row.student_id, list);
      }
      return map;
    },
    staleTime: 30 * 1000,
  });
}

/** The audit trail for one bundle, newest edit first. */
export function useBundleEdits(bundleId: string | null) {
  return useQuery<BundleEdit[]>({
    queryKey: [...BUNDLE_KEYS.balances, "edits", bundleId],
    enabled: !!bundleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_bundle_edits")
        .select("id, bundle_id, edited_at, edited_by, changes")
        .eq("bundle_id", bundleId!)
        .order("edited_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BundleEdit[];
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
        .select(SESSION_COLUMNS)
        .eq("student_id", studentId!)
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentClassSession[];
    },
  });
}

/**
 * Per-bundle usage across every student, in one query: how many counted
 * sessions each bundle carries, and the date of the most recent one.
 * useBundleBalances only ever covers the ACTIVE bundle per student, so a
 * completed bundle's own usage — what the card's completed-bundle line
 * needs — has nowhere else to come from.
 */
export function useBundleSessionSummaries() {
  return useQuery<Map<string, { used: number; lastDate: string | null }>>({
    queryKey: [...BUNDLE_KEYS.sessions, "bundle-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_class_sessions")
        .select("bundle_id, session_date, counted")
        .eq("counted", true)
        .order("session_date", { ascending: true });
      if (error) throw error;
      const map = new Map<string, { used: number; lastDate: string | null }>();
      for (const row of (data ?? []) as { bundle_id: string; session_date: string }[]) {
        const cur = map.get(row.bundle_id) ?? { used: 0, lastDate: null };
        cur.used += 1;
        cur.lastDate = row.session_date; // ascending order -- last write is the latest date
        map.set(row.bundle_id, cur);
      }
      return map;
    },
    staleTime: 30 * 1000,
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
        .select(SESSION_COLUMNS)
        .gte("session_date", sinceDate)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentClassSession[];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * The private lessons the weekly generator has already put on the calendar and
 * nobody has answered for yet, soonest first.
 *
 * Today counts as upcoming: a lesson taught this morning is exactly the one Re
 * wants to answer for, and dropping it the moment midnight passes in some other
 * timezone would hide it. The cutoff is read in the teacher's own zone for the
 * same reason every other date in this feature is.
 */
export function useUpcomingScheduledSessions() {
  return useQuery<StudentClassSession[]>({
    queryKey: BUNDLE_KEYS.upcoming,
    queryFn: async () => {
      const today = localDateKey(new Date(), TIMEZONE);
      const { data, error } = await supabase
        .from("student_class_sessions")
        .select(SESSION_COLUMNS)
        .eq("outcome", "scheduled")
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });
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
  purchased_on: string;
  coverage_start: string;
  note?: string | null;
}

/**
 * Adds a bundle. Any existing active bundle for that student is completed first,
 * because the database allows only one active at a time — doing it here means Re
 * adds a renewal without a separate "close the old one" step.
 *
 * coverage_start_confirmed_at is set to now() here, unconditionally: creating a
 * bundle means typing or accepting its coverage_start in the form right now, so
 * it is reviewed by definition. Only the migration's one-time historical
 * backfill is allowed to leave this null.
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

      const { error } = await supabase.from("student_bundles").insert({
        ...input,
        coverage_start_confirmed_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

/**
 * Edits an existing bundle, or voids one (status: "cancelled" + voided_reason).
 * The database's own audit trigger (trg_student_bundles_audit) writes the
 * old/new diff; nothing here needs to.
 *
 * A plain passthrough update -- deliberately. Whether saving counts as
 * reviewing coverage_start is a UI-workflow decision the caller (the edit
 * dialog, vs. the void dialog) already knows and states explicitly in what
 * it passes, rather than this hook inferring it from which fields happen to
 * be present.
 */
export function useUpdateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, ...input
    }: Partial<BundleInput> & {
      id: string;
      status?: BundleStatus;
      coverage_start_confirmed_at?: string | null;
      voided_reason?: string | null;
      voided_at?: string | null;
    }) => {
      const { error } = await supabase.from("student_bundles").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

export interface DeleteBundleInput {
  bundle: StudentBundle;
  /** For the audit record only -- readable at a glance without re-deriving
   * numbering from a bundle list that, after this delete, will already have
   * shifted. */
  bundleNumber: number;
}

/**
 * Deletes a bundle outright. The UI only ever offers this for a cancelled
 * bundle with zero student_class_sessions rows referencing it (any status,
 * not just counted) -- but that is a courtesy, not the guard. The real guard
 * is the database's ON DELETE RESTRICT foreign key, which refuses the delete
 * regardless (Postgres error 23503), translated here into a message pointing
 * at Void instead. Never retried, never falls back to a different delete path
 * -- a failed delete leaves the bundle exactly as it was.
 *
 * Deletes first, logs second: the row is gone the moment the delete succeeds,
 * so nothing here should claim a deletion happened before it really did. The
 * log goes to admin_audit_log rather than student_bundle_edits -- that
 * table's bundle_id column is ON DELETE CASCADE, so a row written there for
 * this bundle would vanish in the very same statement that deletes its
 * parent, which would defeat the entire point of keeping a durable record of
 * what was destroyed. admin_audit_log has no such foreign key, so the record
 * outlives the row it describes. If the log write itself fails, the deletion
 * -- which already succeeded and cannot be rolled back by a logging error --
 * is still reported as done; the caller distinguishes an unlogged deletion by
 * `auditLogged: false` rather than this throwing.
 */
export function useDeleteBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bundle, bundleNumber }: DeleteBundleInput) => {
      const { error } = await supabase.from("student_bundles").delete().eq("id", bundle.id);
      if (error) {
        if (error.code === "23503") {
          throw new Error("This bundle has classes recorded against it — void it instead of deleting it.");
        }
        throw error;
      }

      const { data: userData } = await supabase.auth.getUser();
      const { error: logErr } = await supabase.from("admin_audit_log").insert({
        admin_id: userData.user?.id ?? null,
        action: "bundle_deleted",
        field: `Bundle ${bundleNumber} — ${bundle.label}`,
        old_value: JSON.stringify({
          bundle_id: bundle.id,
          student_id: bundle.student_id,
          bundle_number: bundleNumber,
          label: bundle.label,
          source: bundle.source,
          catalog_key: bundle.catalog_key,
          total_classes: bundle.total_classes,
          total_price: bundle.total_price,
          currency: bundle.currency,
          purchased_on: bundle.purchased_on,
          coverage_start: bundle.coverage_start,
          status: bundle.status,
          voided_reason: bundle.voided_reason,
          voided_at: bundle.voided_at,
          note: bundle.note,
          deleted_at: new Date().toISOString(),
        }),
      });
      return { auditLogged: !logErr };
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

/** One entry parsed back out of admin_audit_log's bundle_deleted rows. */
export interface DeletedBundleRecord {
  id: string;
  deletedAt: string;
  snapshot: {
    bundle_number: number;
    label: string;
    total_classes: number;
    total_price: number;
    currency: string;
    coverage_start: string;
    voided_reason: string | null;
  };
}

/**
 * A student's deleted bundles, newest first -- the durable record left behind
 * by useDeleteBundle. Reads admin_audit_log directly rather than
 * student_bundle_edits (see useDeleteBundle for why) and filters to this
 * student client-side, since the log has no student_id column of its own --
 * the table is small and general-purpose, not scoped to bundles.
 */
export function useDeletedBundles(studentId: string | null) {
  return useQuery<DeletedBundleRecord[]>({
    queryKey: ["admin", "bundle-deletions", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, created_at, old_value")
        .eq("action", "bundle_deleted")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const out: DeletedBundleRecord[] = [];
      for (const row of (data ?? []) as { id: string; created_at: string; old_value: string | null }[]) {
        try {
          const snapshot = JSON.parse(row.old_value ?? "{}");
          if (snapshot.student_id === studentId) out.push({ id: row.id, deletedAt: row.created_at, snapshot });
        } catch {
          // A row this parser cannot read is skipped, not thrown -- one bad
          // record must never take down the rest of a student's history.
        }
      }
      return out;
    },
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
 * Confirms one or many sessions in a single statement.
 *
 * A single statement is the batch guarantee: Postgres applies it whole, so a
 * batch is never partially applied and the UI never has to reason about which
 * half of a catch-up landed. That is unchanged; what changed is which
 * statement.
 *
 * It is an upsert on uq_student_class_sessions_slot rather than an insert
 * because the weekly generator may already have written a `scheduled` row into
 * that exact (student, date, time) slot. Against a plain insert that row is a
 * unique-constraint violation, and one pre-scheduled lesson anywhere in a batch
 * refused the entire batch — Re could not confirm a class the system itself had
 * put on her calendar. Confirming is precisely the act of answering for that
 * slot, so overwriting the placeholder with the real outcome is the correct
 * resolution, not a collision. confirmed_at is stamped here for the same
 * reason: a scheduled row carries null until somebody answers, and this is
 * where somebody does.
 */
export function useConfirmSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: ConfirmSessionInput[]) => {
      if (rows.length === 0) return;
      const { error } = await supabase.from("student_class_sessions").upsert(
        rows.map(r => ({
          ...r,
          counted: r.outcome === "attended",
          confirmed_at: new Date().toISOString(),
        })),
        { onConflict: "student_id,session_date,start_time" },
      );
      if (error) throw error;
    },
    onSuccess: () => invalidateCredits(qc),
  });
}

/**
 * Answers for a lesson the generator already put on the calendar: the row
 * exists, so this updates it in place rather than writing a second one into a
 * slot the unique constraint reserves for exactly one. `counted` is derived
 * from the outcome here, never passed in — the database CHECK ties the two
 * together and a caller that could disagree with it would only ever be wrong.
 */
export function useResolveScheduledSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, outcome }: { id: string; outcome: SessionOutcome }) => {
      const { error } = await supabase
        .from("student_class_sessions")
        .update({
          outcome,
          counted: outcome === "attended",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateCredits(qc);
      qc.invalidateQueries({ queryKey: BUNDLE_KEYS.upcoming });
    },
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

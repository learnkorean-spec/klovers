/**
 * The private-lesson confirm queue — one derivation, two screens.
 *
 * "Classes your schedule says have happened" looks like a list and is really a
 * set of rules that are not obvious from the markup:
 *
 *   - the confirmed-sessions fetch has to reach back at least as far as the
 *     EARLIEST effective_from across every student's classes, or a confirmation
 *     older than that boundary is never fetched and its occurrence wrongly
 *     reappears as outstanding;
 *   - a student with no bundle at all is skipped — there is nothing to draw a
 *     credit from, and nagging about it would not help;
 *   - each row is charged to the bundle in force ON ITS OWN DATE
 *     (resolveBundleForDate), never to "whichever bundle is active right now" —
 *     a queue spanning a renewal must charge each date to the bundle that
 *     actually covered it.
 *
 * My Students and /admin/today both show this queue. A second copy of those
 * rules is how two screens end up disagreeing about what Re still owes an
 * answer for, so there is exactly one and both call it.
 *
 * Two callers is not two fetches: every query underneath is keyed through
 * react-query, so the second caller reads the first one's cache.
 */
import { useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { ADMIN_TIMEZONE } from "@/constants/scheduling";
import {
  useMyStudents, useRecentSessions, useAllBundles, useConfirmSessions,
} from "@/hooks/admin/useMyStudents";
import {
  buildExpectedSessions, localDateKey, resolveBundleForDate,
  type ExpectedSession, type MyStudentWithClasses, type StudentBundle,
} from "@/types/students";

/** One outstanding class, with the bundle that covers its date (or none). */
export interface ConfirmQueueRow {
  student: MyStudentWithClasses;
  occ: ExpectedSession;
  bundle: StudentBundle | null;
}

/**
 * The bundle to open when a session has no bundle covering its date at all --
 * the earliest one, since pulling ITS coverage_start further back is the fix
 * that would actually reach the date. A voided bundle is skipped for the same
 * reason resolveBundleForDate skips it: it was voided because it was wrong,
 * so it is never the thing to widen. Falls back to the plain earliest if
 * every bundle happens to be voided, so the fix is never a dead end.
 */
export function earliestBundleToFix(bundles: StudentBundle[]): StudentBundle | null {
  if (bundles.length === 0) return null;
  const candidates = bundles.filter(b => b.status !== "cancelled");
  const pool = candidates.length > 0 ? candidates : bundles;
  return [...pool].sort((a, b) => a.coverage_start.localeCompare(b.coverage_start))[0];
}

export function usePrivateConfirmQueue() {
  const { data: students = [], isLoading } = useMyStudents();

  // Derived from students, not a fixed cutoff, so correcting a class's start
  // date widens the window the moment it is saved.
  const since = useMemo(() => {
    const dates = students.flatMap(s => s.classes.map(c => c.effective_from)).filter(Boolean);
    return dates.length
      ? dates.reduce((min, d) => (d < min ? d : min))
      : localDateKey(new Date(), ADMIN_TIMEZONE);
  }, [students]);

  const { data: recentSessions = [] } = useRecentSessions(since);
  // Every bundle, any status -- resolveBundleForDate needs the whole history
  // per student, not just whichever one is currently active.
  const { data: allBundles } = useAllBundles();
  const confirmSessions = useConfirmSessions();

  /**
   * Every occurrence the weekly schedule implies over the window, per student,
   * paired with its confirmation. Rebuilt from the schedule each render rather
   * than stored, so editing a class immediately changes what is offered.
   */
  const expectedByStudent = useMemo(() => {
    const map = new Map<string, ExpectedSession[]>();
    for (const student of students) {
      map.set(student.id, buildExpectedSessions(
        student.classes,
        recentSessions.filter(r => r.student_id === student.id),
        { timeZone: ADMIN_TIMEZONE },
      ));
    }
    return map;
  }, [students, recentSessions]);

  /** Newest first — the class she is most likely to be answering for. */
  const toConfirm = useMemo(() => {
    const rows: ConfirmQueueRow[] = [];
    for (const student of students) {
      const studentBundles = allBundles?.get(student.id) ?? [];
      if (studentBundles.length === 0) continue;
      for (const occ of expectedByStudent.get(student.id) ?? []) {
        if (!occ.confirmed) {
          rows.push({ student, occ, bundle: resolveBundleForDate(studentBundles, occ.session_date) });
        }
      }
    }
    return rows.sort((a, b) =>
      b.occ.session_date.localeCompare(a.occ.session_date) ||
      b.occ.start_time.localeCompare(a.occ.start_time));
  }, [students, allBundles, expectedByStudent]);

  /**
   * Counted sessions per bundle, from the same recentSessions fetch that
   * covers every student's full confirm window -- used only to word the
   * "N left" toasts after a confirm; not the source of truth for balance
   * (get_student_bundle_balances is, for the active bundle's own card).
   */
  const usedByBundle = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of recentSessions) {
      if (!s.counted) continue;
      map.set(s.bundle_id, (map.get(s.bundle_id) ?? 0) + 1);
    }
    return map;
  }, [recentSessions]);

  /**
   * One click on the strip. The bundle is resolved BY DATE here so the row
   * stays dumb -- resolveBundleForDate picks whichever of the student's
   * bundles actually covers occ.session_date, not just whichever is active
   * right now.
   */
  const confirmOne = async (
    studentId: string,
    occ: ExpectedSession,
    outcome: "attended" | "cancelled_no_charge",
  ) => {
    const bundle = resolveBundleForDate(allBundles?.get(studentId) ?? [], occ.session_date);
    if (!bundle) {
      toast({ title: "No bundle covers this date", description: "Add or fix a bundle's start date before counting this class.", variant: "destructive" });
      return;
    }
    try {
      await confirmSessions.mutateAsync([{
        student_id: studentId,
        bundle_id: bundle.id,
        class_id: occ.class_id,
        session_date: occ.session_date,
        start_time: occ.start_time,
        outcome,
      }]);
      const remaining = bundle.total_classes - (usedByBundle.get(bundle.id) ?? 0) - (outcome === "attended" ? 1 : 0);
      toast({
        title: outcome === "attended" ? "Class counted" : "Marked as not held",
        description: outcome === "attended"
          ? `${remaining} left on ${bundle.label}.`
          : "No credit was used.",
      });
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    }
  };

  return {
    students,
    isLoading,
    recentSessions,
    allBundles,
    expectedByStudent,
    toConfirm,
    usedByBundle,
    /** The mutation itself, for the batch (catch-up) path that writes many rows at once. */
    confirmSessions,
    confirmOne,
  };
}

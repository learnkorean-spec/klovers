/**
 * Editing a class that has already been answered for.
 *
 * Every other path writes a session: the generator schedules one, the confirm
 * strip answers one. Nothing could CHANGE one. So a private lesson that was
 * marked "did not happen" on its own day and then taught later in the week had
 * no home — the day it really ran was never recorded, and the student's
 * balance stayed one class too high until somebody rebuilt the row by hand.
 * That happened twice before this existed.
 *
 * Moving a session is not a new session. The row keeps its identity and its
 * history; what changes is the date it claims, and therefore which bundle it
 * draws against — which is why the bundle is re-resolved from the NEW date
 * here rather than carried over. A class moved across a renewal must be
 * charged to the bundle that covered the day it was actually taught.
 *
 * `counted` is derived from the outcome, never passed in: the database CHECK
 * ties the two together, so a caller that could disagree with it would only
 * ever be wrong.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveBundleForDate, type SessionOutcome, type StudentBundle } from "@/types/students";

export interface EditSessionInput {
  id: string;
  student_id: string;
  /** "YYYY-MM-DD" — the day the class actually happened. */
  session_date: string;
  /** "HH:MM". */
  start_time: string;
  outcome: SessionOutcome;
  /** Why it moved. Free text, and the only record of the reason. */
  note: string | null;
  /** The student's whole bundle history — the new date is resolved against it. */
  bundles: StudentBundle[];
}

/**
 * Thrown with a sentence a person can act on rather than a Postgres code.
 * 23505 is the (student, date, time) unique constraint: there is already a
 * class recorded in the slot being moved into, and silently overwriting it
 * would destroy a second answered lesson to fix a first.
 */
function readableError(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    return new Error(
      "There is already a class recorded for that student at that date and time. " +
      "Pick a different time, or fix the existing one first.",
    );
  }
  return new Error(error.message);
}

export function useEditRecordedSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditSessionInput) => {
      const bundle = resolveBundleForDate(input.bundles, input.session_date);
      if (!bundle) {
        throw new Error(
          "No bundle covers that date. Pull the bundle's start date back to reach it, " +
          "or pick a date inside a bundle the student has.",
        );
      }

      const { error } = await supabase
        .from("student_class_sessions")
        .update({
          session_date: input.session_date,
          start_time: input.start_time,
          outcome: input.outcome,
          counted: input.outcome === "attended",
          bundle_id: bundle.id,
          note: input.note?.trim() ? input.note.trim() : null,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", input.id);

      if (error) throw readableError(error);
      return bundle;
    },
    onSuccess: () => {
      // The same three families the confirm path invalidates: the balance is
      // counted, never stored, so every screen showing it has to re-read.
      qc.invalidateQueries({ queryKey: ["admin", "student-bundles"] });
      qc.invalidateQueries({ queryKey: ["admin", "student-sessions"] });
      qc.invalidateQueries({ queryKey: ["admin", "my-students"] });
    },
  });
}

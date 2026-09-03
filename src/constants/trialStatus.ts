/**
 * The booking statuses that mean a student is still holding a seat.
 *
 * This has to match `v_trial_slots_admin`, which counts a seat as taken when
 *
 *   tb.status IN ('pending','confirmed','awaiting_attendance','confirmed_attendance')
 *     AND tb.is_tba = false
 *
 * Before this file the list was written out by hand in four places and got
 * it wrong in three, always the same way: `['pending','confirmed']`. That
 * omits `awaiting_attendance` — the status `book-trial` gives EVERY
 * authenticated booking:
 *
 *   const bookingStatus = authed && resolvedUserId ? "awaiting_attendance" : "confirmed";
 *
 * so a filter built on the short list matches no signed-in student's booking
 * at all. An UPDATE that matches nothing is not an error in PostgREST — it
 * returns success — which is how "cancel my trial" came to show a
 * confirmation toast while the booking stayed live and the seat stayed
 * blocked.
 */
export const ACTIVE_TRIAL_STATUSES = [
  "pending",
  "confirmed",
  "awaiting_attendance",
  "confirmed_attendance",
] as const;

export type ActiveTrialStatus = (typeof ACTIVE_TRIAL_STATUSES)[number];

/** Mutable copy — PostgREST's `.in()` does not accept a readonly tuple. */
export const ACTIVE_TRIAL_STATUS_LIST: string[] = [...ACTIVE_TRIAL_STATUSES];

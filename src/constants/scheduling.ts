/**
 * Source-of-truth timezone for trial class scheduling that is expressed in the
 * TEACHER's clock rather than the student's.
 *
 * Note what this is not: trial_slots, trial_bookings, schedule_packages and
 * matching_slots all store Africa/Cairo and carry their own `timezone` column,
 * so a real slot never depends on this constant. It is the fallback for a row
 * that has no zone of its own, and the default offered when a new one is
 * created — which is why it has to name where the teacher actually is.
 */
export const TIMEZONE = "Asia/Bangkok";
/** Timezone the admin/teacher operates in — used to localize admin dashboard displays. */
export const ADMIN_TIMEZONE = "Asia/Bangkok";
export const PRIVATE_TIME_OPTIONS = ["10:00", "18:00"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Re's ongoing 1:1 students and their weekly classes.
 *
 * Deliberately separate from the site's registered-student types: these people
 * are not signed up on kloversegy.com, they are private students whose classes
 * block trial availability. Contact details, levels and billing are a later
 * phase and will extend `MyStudent` rather than replace it.
 */

export const STUDENT_SUBJECTS = ["korean", "english"] as const;
export type StudentSubject = (typeof STUDENT_SUBJECTS)[number];

export const STUDENT_STATUSES = ["active", "paused", "ended"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export interface MyStudent {
  id: string;
  full_name: string;
  /** What they learn. NOT the language of instruction. */
  subject: StudentSubject;
  status: StudentStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentClassSchedule {
  id: string;
  student_id: string;
  /** 0 = Sunday .. 6 = Saturday, matching Postgres EXTRACT(DOW). */
  weekday: number;
  /** "HH:MM:SS" as returned by Postgres `time`. */
  start_time: string;
  duration_minutes: number;
  timezone: string;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
}

export interface MyStudentWithClasses extends MyStudent {
  classes: StudentClassSchedule[];
}

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const SUBJECT_LABEL: Record<StudentSubject, string> = {
  korean: "Learning Korean",
  english: "Learning English",
};

export const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
};

/** "23:00:00" or "23:00" -> minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 1410 -> "23:30". Wraps past 24h so a class crossing midnight reads correctly. */
export function minutesToTime(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** True when the class runs past midnight into the following day. */
export function crossesMidnight(startTime: string, durationMinutes: number): boolean {
  return timeToMinutes(startTime) + durationMinutes > 1440;
}

/**
 * "23:00 – 00:30 (+1 day)" for a class that wraps, "16:00 – 17:30" otherwise.
 * A wrapping class is still one class; the suffix says where it ends, it does
 * not imply a second entry.
 */
export function formatClassRange(startTime: string, durationMinutes: number): string {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const label = `${minutesToTime(start)} – ${minutesToTime(end)}`;
  return end > 1440 ? `${label} (+1 day)` : label;
}

/** "Mon 22:00 – 23:30 · Tue 22:00 – 23:30" for a compact list row. */
export function formatWeeklySummary(classes: StudentClassSchedule[]): string {
  if (!classes.length) return "No classes scheduled";
  return [...classes]
    .sort((a, b) =>
      a.weekday - b.weekday || timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    .map(c => `${DAY_SHORT[c.weekday]} ${formatClassRange(c.start_time, c.duration_minutes)}`)
    .join(" · ");
}

/** Total teaching minutes a week — shown so a schedule change is easy to sanity-check. */
export function weeklyMinutes(classes: StudentClassSchedule[]): number {
  return classes.reduce((sum, c) => sum + c.duration_minutes, 0);
}

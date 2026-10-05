/**
 * The seven-day read, in one query pass.
 *
 * Today answers "what needs me now". This answers the other question nobody
 * had a screen for: "what happened while I was not looking, and who is new".
 * It is written to be read by someone who does not know the schema — Re, and
 * whoever is helping her — so every field here is something a person would
 * say out loud, not a column name.
 *
 * Two deliberate choices about the window:
 *
 *   - Signups, enrolments, admin actions, warnings and emails are windowed by
 *     `created_at`. Seven days, not "since you last looked": a fixed window is
 *     the same report whoever opens it and however long they were away.
 *   - Trial sessions are NOT windowed. A session's whole meaning is whether
 *     the people booked into it have said they are coming, and that is a
 *     question about the future. Windowing it by creation date would hide the
 *     session running on Friday because it was created three weeks ago.
 *
 * Everything is read-only. This screen never writes.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages } from "@/lib/fetchAllPages";

export const WEEK_DAYS = 7;

export interface NewPerson {
  id: string;
  name: string | null;
  email: string | null;
  country: string | null;
  level: string | null;
  language: string | null;
  created_at: string;
}

export interface TrialSessionTally {
  key: string;
  trial_date: string;
  start_time: string | null;
  class_language: string | null;
  booked: number;
  asked: number;
  yes: number;
  no: number;
  /** Asked and has not answered. Not the same as "not asked" — see AdminToday. */
  silent: number;
}

export interface NewEnrollment {
  id: string;
  name: string | null;
  email: string | null;
  plan_type: string | null;
  duration: number | null;
  classes_included: number | null;
  amount: number | null;
  currency: string | null;
  payment_status: string | null;
  approval_status: string | null;
  created_at: string;
}

export interface LessonRow {
  id: string;
  student: string;
  session_date: string;
  start_time: string;
  outcome: string;
}

export interface AdminAction {
  id: string;
  created_at: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  by: string;
}

export interface SystemWarning {
  id: string;
  created_at: string;
  type: string | null;
  message: string;
  read: boolean;
}

export interface WeekReview {
  /** The ISO instant the window opens at — shown so the header can name it. */
  since: string;
  today: string;
  newPeople: NewPerson[];
  sessions: TrialSessionTally[];
  enrollments: NewEnrollment[];
  lessonsHeld: LessonRow[];
  lessonsUnanswered: LessonRow[];
  adminActions: AdminAction[];
  warnings: SystemWarning[];
  emails: { template: string; count: number }[];
}

/** "2026-09-14" in the viewer's own zone — the boundary "already passed" uses. */
function todayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useWeekReview(days: number = WEEK_DAYS) {
  return useQuery<WeekReview>({
    queryKey: ["admin", "week-review", days],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const today = todayKey();
      // The same boundary as `since`, as a plain date key: session_date is a
      // DATE, not a timestamp, so it cannot be compared against an instant.
      const windowStart = new Date(Date.now() - days * 86400000);
      const p2 = (n: number) => String(n).padStart(2, "0");
      const windowKey = `${windowStart.getFullYear()}-${p2(windowStart.getMonth() + 1)}-${p2(windowStart.getDate())}`;

      const [
        profilesRes,
        bookingsRes,
        enrollmentsRes,
        sessionsRes,
        studentsRes,
        auditRes,
        notificationsRes,
        emailsRes,
      ] = await Promise.all([
        fetchAllPages<any>((f, t) => supabase
          .from("profiles")
          .select("id, user_id, name, email, country, level, language, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .order("id")
          .range(f, t) as never),
        // Every live dated booking, tallied in memory — the same shape Today
        // uses, so the two screens cannot disagree about a session.
        fetchAllPages<any>((f, t) => supabase
          .from("trial_bookings")
          .select("id, trial_date, start_time, class_language, attendance_response, attendance_email_sent_at")
          .neq("status", "cancelled")
          .not("trial_date", "is", null)
          .order("id")
          .range(f, t) as never),
        fetchAllPages<any>((f, t) => supabase
          .from("enrollments")
          .select("id, user_id, plan_type, duration, classes_included, amount, currency, payment_status, approval_status, created_at")
          .is("deleted_at", null)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .order("id")
          .range(f, t) as never),
        fetchAllPages<any>((f, t) => supabase
          .from("student_class_sessions")
          .select("id, student_id, session_date, start_time, outcome")
          .gte("session_date", windowKey)
          .order("session_date", { ascending: false })
          .order("id")
          .range(f, t) as never),
        supabase.from("teacher_students").select("id, full_name"),
        fetchAllPages<any>((f, t) => supabase
          .from("admin_audit_log")
          .select("id, admin_id, action, field, old_value, new_value, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .order("id")
          .range(f, t) as never),
        fetchAllPages<any>((f, t) => supabase
          .from("admin_notifications")
          .select("id, type, message, read, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .order("id")
          .range(f, t) as never),
        fetchAllPages<any>((f, t) => supabase
          .from("email_logs")
          .select("id, template")
          .gte("created_at", since)
          .order("id")
          .range(f, t) as never),
      ]);

      for (const r of [profilesRes, bookingsRes, enrollmentsRes, sessionsRes, studentsRes, auditRes, notificationsRes, emailsRes]) {
        if (r.error) throw r.error;
      }

      // --- who is new -------------------------------------------------------
      const newPeople = ((profilesRes.data ?? []) as Array<NewPerson & { user_id: string }>)
        .map(p => ({
          id: p.id, name: p.name, email: p.email, country: p.country,
          level: p.level, language: p.language, created_at: p.created_at,
        }));

      // --- trial sessions ---------------------------------------------------
      const tally = new Map<string, TrialSessionTally>();
      for (const b of (bookingsRes.data ?? []) as Array<{
        trial_date: string; start_time: string | null; class_language: string | null;
        attendance_response: string | null; attendance_email_sent_at: string | null;
      }>) {
        const key = `${b.trial_date}|${b.start_time ?? ""}`;
        const row = tally.get(key) ?? {
          key, trial_date: b.trial_date, start_time: b.start_time,
          class_language: b.class_language, booked: 0, asked: 0, yes: 0, no: 0, silent: 0,
        };
        row.booked += 1;
        if (b.attendance_email_sent_at) row.asked += 1;
        if (b.attendance_response === "yes") row.yes += 1;
        if (b.attendance_response === "no") row.no += 1;
        tally.set(key, row);
      }
      const sessions = [...tally.values()]
        .map(s => ({ ...s, silent: Math.max(0, s.asked - s.yes - s.no) }))
        .filter(s => s.trial_date >= today)
        .sort((a, b) => a.trial_date.localeCompare(b.trial_date) || (a.start_time ?? "").localeCompare(b.start_time ?? ""));

      // --- money ------------------------------------------------------------
      // The people behind the enrolments, in one extra query rather than a
      // join: enrollments.user_id has no foreign key to profiles, so PostgREST
      // cannot embed it.
      const userIds = [...new Set(((enrollmentsRes.data ?? []) as Array<{ user_id: string | null }>)
        .map(e => e.user_id).filter((x): x is string => !!x))];
      const whoById = new Map<string, { name: string | null; email: string | null }>();
      if (userIds.length > 0) {
        const { data: people, error } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);
        if (error) throw error;
        for (const p of (people ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>) {
          whoById.set(p.user_id, { name: p.name, email: p.email });
        }
      }
      const enrollments = ((enrollmentsRes.data ?? []) as Array<Omit<NewEnrollment, "name" | "email"> & { user_id: string | null }>)
        .map(e => ({
          ...e,
          name: e.user_id ? whoById.get(e.user_id)?.name ?? null : null,
          email: e.user_id ? whoById.get(e.user_id)?.email ?? null : null,
        }));

      // --- private lessons --------------------------------------------------
      const studentName = new Map(
        ((studentsRes.data ?? []) as Array<{ id: string; full_name: string }>).map(s => [s.id, s.full_name]),
      );
      const allLessons = ((sessionsRes.data ?? []) as Array<{
        id: string; student_id: string; session_date: string; start_time: string; outcome: string;
      }>).map(s => ({
        id: s.id,
        student: studentName.get(s.student_id) ?? "—",
        session_date: s.session_date,
        start_time: s.start_time,
        outcome: s.outcome,
      }));
      const lessonsHeld = allLessons
        .filter(l => l.outcome !== "scheduled" && l.session_date >= windowKey && l.session_date <= today);
      // A lesson the generator put on the calendar, whose day has come and
      // gone with no answer. Until it is answered the bundle's remaining count
      // is too high — which is why this is on the report at all.
      const lessonsUnanswered = allLessons
        .filter(l => l.outcome === "scheduled" && l.session_date < today)
        .sort((a, b) => a.session_date.localeCompare(b.session_date));

      // --- who did what in the admin ---------------------------------------
      const adminIds = [...new Set(((auditRes.data ?? []) as Array<{ admin_id: string | null }>)
        .map(a => a.admin_id).filter((x): x is string => !!x))];
      const adminEmail = new Map<string, string>();
      if (adminIds.length > 0) {
        const { data: admins, error } = await supabase
          .from("profiles")
          .select("user_id, email, name")
          .in("user_id", adminIds);
        if (error) throw error;
        for (const a of (admins ?? []) as Array<{ user_id: string; email: string | null; name: string | null }>) {
          adminEmail.set(a.user_id, a.name || a.email || a.user_id);
        }
      }
      const adminActions = ((auditRes.data ?? []) as Array<{
        id: string; admin_id: string | null; action: string; field: string | null;
        old_value: string | null; new_value: string | null; created_at: string;
      }>).map(a => ({
        id: a.id,
        created_at: a.created_at,
        action: a.action,
        field: a.field,
        old_value: a.old_value,
        new_value: a.new_value,
        // The system writes audit rows too, with no admin behind them. Saying
        // "the system" is honest; attributing them to Re would not be.
        by: a.admin_id ? adminEmail.get(a.admin_id) ?? "unknown admin" : "the system",
      }));

      // --- warnings ---------------------------------------------------------
      const warnings = ((notificationsRes.data ?? []) as Array<{
        id: string; type: string | null; message: string | null; read: boolean; created_at: string;
      }>).map(n => ({
        id: n.id, type: n.type, message: (n.message ?? "").trim(), read: n.read, created_at: n.created_at,
      })).filter(n => n.message.length > 0);

      // --- email ------------------------------------------------------------
      const byTemplate = new Map<string, number>();
      for (const e of (emailsRes.data ?? []) as Array<{ template: string | null }>) {
        const t = e.template ?? "(none)";
        byTemplate.set(t, (byTemplate.get(t) ?? 0) + 1);
      }
      const emails = [...byTemplate.entries()]
        .map(([template, count]) => ({ template, count }))
        .sort((a, b) => b.count - a.count);

      return {
        since, today, newPeople, sessions, enrollments,
        lessonsHeld, lessonsUnanswered, adminActions, warnings, emails,
      };
    },
  });
}

/**
 * The next seven days of private lessons as a timetable: one column per day,
 * each lesson shown by student name at its time. Read-only on purpose; answering
 * for a lesson stays in the confirm queue on My Students.
 */
import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyStudents, useUpcomingScheduledSessions } from "@/hooks/admin/useMyStudents";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getAdminTimezone } from "@/lib/viewerTimezone";
import { TIMEZONE } from "@/constants/scheduling";
import { localDateKey, type StudentClassSession } from "@/types/students";

const DAYS = 7;

/** Small fixed palette so each student keeps the same colour across the week. */
const STUDENT_TONES = [
  "border-blue-500 bg-blue-50 dark:bg-blue-950/40",
  "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
  "border-amber-500 bg-amber-50 dark:bg-amber-950/40",
  "border-violet-500 bg-violet-50 dark:bg-violet-950/40",
  "border-rose-500 bg-rose-50 dark:bg-rose-950/40",
] as const;

/** Adds whole days to a YYYY-MM-DD key without touching any timezone. */
const addDays = (dateKey: string, days: number): string => {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const dayLabel = (dateKey: string): string =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const UpcomingPrivateClasses = () => {
  const { data: sessions = [], isLoading } = useUpcomingScheduledSessions();
  const { data: students = [] } = useMyStudents();

  const studentName = useMemo(
    () => new Map(students.map(s => [s.id, s.full_name])),
    [students],
  );

  const classTimezone = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      for (const c of s.classes) map.set(c.id, c.timezone);
    }
    return map;
  }, [students]);

  const todayKey = localDateKey(new Date(), TIMEZONE);
  const teacherTz = getAdminTimezone();

  const days = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => addDays(todayKey, i)),
    [todayKey],
  );

  const byDay = useMemo(() => {
    const groups = new Map<string, StudentClassSession[]>(days.map(d => [d, []]));
    for (const s of sessions) {
      const list = groups.get(s.session_date);
      if (list) list.push(s);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return groups;
  }, [sessions, days]);

  const toneFor = useMemo(() => {
    const ids = [...new Set(sessions.map(s => s.student_id))].sort();
    const map = new Map(ids.map((id, i) => [id, STUDENT_TONES[i % STUDENT_TONES.length]]));
    return (id: string) => map.get(id) ?? STUDENT_TONES[0];
  }, [sessions]);

  const total = days.reduce((n, d) => n + (byDay.get(d)?.length ?? 0), 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Private classes, next 7 days
          {total > 0 && <Badge variant="secondary">{total}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-2">Loading…</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No private classes in the next 7 days.
          </p>
        ) : (
          // Scrolls sideways on a phone instead of crushing seven columns
          // into 390px, where names were cut to three letters.
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <div className="grid grid-cols-7 gap-2 min-w-[790px]">
            {days.map(date => {
              const rows = byDay.get(date) ?? [];
              const isToday = date === todayKey;
              return (
                <div key={date} className="min-w-[110px] space-y-1.5">
                  <p
                    className={`text-xs font-semibold pb-1 border-b ${
                      isToday ? "text-primary border-primary" : "text-muted-foreground border-border"
                    }`}
                  >
                    {dayLabel(date)}
                  </p>
                  {rows.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60">—</p>
                  ) : (
                    rows.map(row => {
                      const sourceTz = classTimezone.get(row.class_id ?? "") ?? TIMEZONE;
                      const local = convertDateTimeToTimezone(
                        date,
                        row.start_time.slice(0, 5),
                        sourceTz,
                        teacherTz,
                      );
                      return (
                        <div
                          key={row.id}
                          className={`rounded-md border-l-4 px-2 py-1.5 ${toneFor(row.student_id)}`}
                        >
                          <p className="text-[11px] text-muted-foreground">{local.timeFormatted}</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {studentName.get(row.student_id) ?? "Unknown"}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingPrivateClasses;

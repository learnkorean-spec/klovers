/**
 * The private lessons already on the calendar, and one click to answer for
 * each.
 *
 * The confirm queue in My Students only ever looks backwards, so until this
 * card existed the rows the weekly generator writes were invisible: fourteen
 * real lessons sitting in the database that no screen in the admin mentioned.
 */
import { useMemo, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  useMyStudents,
  useResolveScheduledSession,
  useUpcomingScheduledSessions,
} from "@/hooks/admin/useMyStudents";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getAdminTimezone } from "@/lib/viewerTimezone";
import { TIMEZONE } from "@/constants/scheduling";
import {
  formatSessionDate,
  localDateKey,
  type SessionOutcome,
  type StudentClassSession,
} from "@/types/students";

/** Re reads her own day in Cairo whatever clock the lesson was scheduled on. */
const CAIRO_TZ = "Africa/Cairo";

const UpcomingPrivateClasses = () => {
  const { data: sessions = [], isLoading } = useUpcomingScheduledSessions();
  const { data: students = [] } = useMyStudents();
  const resolve = useResolveScheduledSession();

  // Which row is mid-flight, not merely whether the mutation is running: two
  // rows share one mutation hook, so `resolve.isPending` alone would grey out
  // every button on the card for a click on one of them.
  const [pendingId, setPendingId] = useState<string | null>(null);

  const studentName = useMemo(
    () => new Map(students.map(s => [s.id, s.full_name])),
    [students],
  );

  /**
   * start_time is stored on the clock of the class that owns it, not in UTC
   * and not in Cairo, so the zone has to come from the class row. Falling back
   * to the teacher's configured zone rather than a literal keeps a lesson whose
   * class row has since been closed from being read on the wrong clock.
   */
  const classTimezone = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      for (const c of s.classes) map.set(c.id, c.timezone);
    }
    return map;
  }, [students]);

  const todayKey = localDateKey(new Date(), TIMEZONE);
  const teacherTz = getAdminTimezone();

  const byDate = useMemo(() => {
    const groups = new Map<string, StudentClassSession[]>();
    for (const s of sessions) {
      if (s.session_date < todayKey) continue;
      const list = groups.get(s.session_date) ?? [];
      list.push(s);
      groups.set(s.session_date, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sessions, todayKey]);

  const answer = async (session: StudentClassSession, outcome: SessionOutcome) => {
    setPendingId(session.id);
    try {
      await resolve.mutateAsync({ id: session.id, outcome });
      toast({
        title: outcome === "attended" ? "Class counted" : "Marked as not held",
        description: `${studentName.get(session.student_id) ?? "Student"} · ${formatSessionDate(session.session_date)}`,
      });
    } catch (err) {
      toast({
        title: "Couldn't save that",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Upcoming private classes
          {byDate.length > 0 && (
            <Badge variant="secondary">{byDate.reduce((n, [, rows]) => n + rows.length, 0)}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : byDate.length === 0 ? (
          // Nothing here is a normal Sunday, not a failure: the generator fills
          // this list once a week and it empties as the week is answered for.
          <p className="text-sm text-muted-foreground py-2">
            Nothing on the calendar yet — the weekly generator runs Mondays at 02:00.
          </p>
        ) : (
          <div className="space-y-4">
            {byDate.map(([date, rows]) => (
              <div key={date} className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {formatSessionDate(date)}
                </p>
                {rows.map(row => {
                  const sourceTz = classTimezone.get(row.class_id ?? "") ?? TIMEZONE;
                  const hhmm = row.start_time.slice(0, 5);
                  const local = convertDateTimeToTimezone(date, hhmm, sourceTz, teacherTz);
                  const cairo = convertDateTimeToTimezone(date, hhmm, sourceTz, CAIRO_TZ);
                  const busy = pendingId === row.id;
                  return (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {studentName.get(row.student_id) ?? "Unknown student"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {local.timeFormatted} {teacherTz} · {cairo.timeFormatted} Cairo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy} onClick={() => answer(row, "attended")}>
                          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          Attended
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => answer(row, "cancelled_no_charge")}
                        >
                          Cancelled
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingPrivateClasses;

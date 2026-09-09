import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Copy, Download } from 'lucide-react';
import { exportCSV, formatTime } from '@/lib/admin-utils';
import { useAllTrialSlots } from '@/hooks/useTrialAdmin';

/**
 * Who answered "are you coming?" and who did not, named, one card per session.
 *
 * "No reply" and "Not asked yet" are kept apart because they call for opposite
 * actions: the first is a student to chase, the second is a letter we never
 * sent. `attendance_email_sent_at` is what separates them — it is stamped when
 * the attendance letter goes out, so a booking with no response and no send
 * stamp was never asked, while one with a stamp and no response ignored us.
 * Every other place this answer appears collapses both into a single dash, and
 * a dash that can mean either is worse than no column at all.
 */

/** Only the columns this roster reads; the parent's query selects `*`. */
interface RosterBooking {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  level: string | null;
  trial_date: string | null;
  start_time: string | null;
  status: string | null;
  attendance_response?: string | null;
  attendance_responded_at?: string | null;
  attendance_email_sent_at?: string | null;
}

type GroupKey = 'coming' | 'declined' | 'no_reply' | 'not_asked';

const GROUP_LABELS: Record<GroupKey, string> = {
  coming: 'Coming',
  declined: "Can't make it",
  no_reply: 'No reply',
  not_asked: 'Not asked yet',
};

/** The wording the CSV uses, so a spreadsheet reads the same as the screen. */
const CSV_ANSWERS: Record<GroupKey, string> = {
  coming: 'Coming',
  declined: "Can't make it",
  no_reply: 'No reply',
  not_asked: 'Not asked',
};

/** trial_slots stores "HH:MM" but a row read back may carry seconds. */
const hhmm = (t: string | null | undefined) => (t ?? '').slice(0, 5);

const sessionKey = (date: string | null | undefined, time: string | null | undefined) =>
  `${date ?? ''}|${hhmm(time)}`;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatStamp = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : '';

/**
 * Which of the four states a booking is in. Order matters: an answer, once
 * given, outranks whether we can prove we asked — bookings answered before the
 * send stamp existed would otherwise read as "not asked yet".
 */
function classify(b: RosterBooking): GroupKey {
  if (b.attendance_response === 'yes') return 'coming';
  if (b.attendance_response === 'no') return 'declined';
  return b.attendance_email_sent_at ? 'no_reply' : 'not_asked';
}

function StudentList({ students }: { students: RosterBooking[] }) {
  return (
    <ul className="space-y-1">
      {students.map((s) => (
        <li key={s.id} className="text-sm leading-tight">
          <span className="text-foreground">{s.name || '(no name)'}</span>{' '}
          <span className="text-xs text-muted-foreground">{s.email || '(no email)'}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TrialAttendanceRoster() {
  // Both of these are already mounted by TrialClassesManager, so React Query
  // hands back the cached rows rather than issuing a second round trip. The
  // slots come from useAllTrialSlots and not the manager's own
  // ["admin","trial-slots"] query because that one selects a column list that
  // leaves out `lifecycle` and `min_to_run`, and this card is built on both.
  const slotsQ = useAllTrialSlots();
  const bookingsQ = useQuery<RosterBooking[]>({
    queryKey: ['admin', 'trial-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_bookings')
        .select('*')
        .order('trial_date', { ascending: false })
        .order('start_time', { ascending: true });
      if (error) {
        toast({ title: 'Error loading bookings', description: error.message, variant: 'destructive' });
        throw error;
      }
      return (data as RosterBooking[] | null) ?? [];
    },
    staleTime: 60 * 1000,
  });

  const sessions = useMemo(() => {
    const bookings = bookingsQ.data ?? [];
    const slots = slotsQ.data ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // A cancelled booking is not a person we are waiting on an answer from, so
    // it never counts towards the run line and never appears in a group.
    const byKey = new Map<string, RosterBooking[]>();
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      if (!b.trial_date || !b.start_time) continue;
      const key = sessionKey(b.trial_date, b.start_time);
      const list = byKey.get(key);
      if (list) list.push(b);
      else byKey.set(key, [b]);
    }

    return slots
      .filter((s) => s.is_active && s.lifecycle === 'active' && s.trial_date && s.trial_date >= todayStr)
      .sort(
        (a, b) =>
          (a.trial_date ?? '').localeCompare(b.trial_date ?? '') ||
          hhmm(a.start_time).localeCompare(hhmm(b.start_time)),
      )
      .map((slot) => {
        const students = byKey.get(sessionKey(slot.trial_date, slot.start_time)) ?? [];
        const groups: Record<GroupKey, RosterBooking[]> = {
          coming: [],
          declined: [],
          no_reply: [],
          not_asked: [],
        };
        for (const s of students) groups[classify(s)].push(s);
        for (const key of Object.keys(groups) as GroupKey[]) {
          groups[key].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        }
        return { slot, students, groups, yes: groups.coming.length };
      });
  }, [bookingsQ.data, slotsQ.data]);

  // Nothing on the calendar means nothing to chase, and an empty card at the
  // top of this screen would only be noise on the days it matters least.
  if (sessions.length === 0) return null;

  const copyEmails = async (emails: string[]) => {
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      toast({
        title: 'Emails copied',
        description: `${emails.length} address${emails.length === 1 ? '' : 'es'} on the clipboard.`,
      });
    } catch (err: any) {
      // The browser refuses the clipboard outside a secure context, and a
      // silent failure here looks exactly like a successful copy.
      toast({
        title: 'Could not copy',
        description: err?.message ?? 'The browser blocked clipboard access.',
        variant: 'destructive',
      });
    }
  };

  const downloadSession = (
    slot: { trial_date: string | null; start_time: string },
    groups: Record<GroupKey, RosterBooking[]>,
  ) => {
    const order: GroupKey[] = ['coming', 'declined', 'no_reply', 'not_asked'];
    const rows = order.flatMap((key) =>
      groups[key].map((s) => [
        s.name ?? '',
        s.email ?? '',
        s.phone ?? '',
        s.level ?? '',
        CSV_ANSWERS[key],
        formatStamp(s.attendance_responded_at),
        formatStamp(s.attendance_email_sent_at),
      ]),
    );
    exportCSV(
      ['Name', 'Email', 'Phone', 'Level', 'Answer', 'Answered at', 'Asked at'],
      rows,
      `trial-attendance-${slot.trial_date}-${hhmm(slot.start_time).replace(':', '')}`,
    );
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Who answered, by session
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Upcoming sessions only. "No reply" means we asked and heard nothing; "Not asked yet" means
          the letter has not gone out.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {sessions.map(({ slot, students, groups, yes }) => {
          const meetsMin = slot.min_to_run != null && yes >= slot.min_to_run;
          return (
            <div key={slot.id} className="rounded-md border bg-card px-3 py-3 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">
                    {slot.trial_date ? formatDate(slot.trial_date) : 'No date'}
                  </span>
                  <span className="text-sm font-mono text-foreground">
                    {formatTime(hhmm(slot.start_time))}
                  </span>
                  {slot.class_language && (
                    <span className="text-xs capitalize text-muted-foreground">{slot.class_language}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {yes} of {students.length} confirmed
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => downloadSession(slot, groups)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download CSV
                </Button>
              </div>

              {/* The number that decides whether the class runs at all, said
                  plainly. A session with no threshold set gets no line rather
                  than a made-up one — guessing here would be guessing about
                  whether to cancel on somebody. */}
              {slot.min_to_run != null && (
                <p className={`text-xs font-medium ${meetsMin ? 'text-primary' : 'text-destructive'}`}>
                  {meetsMin ? 'Runs: ' : 'Short: '}
                  needs {slot.min_to_run} to run — has {yes}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {(['coming', 'declined', 'no_reply', 'not_asked'] as GroupKey[]).map((key) => {
                  const members = groups[key];
                  if (members.length === 0) return null;
                  const emails = members.map((m) => m.email).filter((e): e is string => !!e);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {GROUP_LABELS[key]} ({members.length})
                        </h4>
                        {key === 'no_reply' && emails.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-xs"
                            onClick={() => copyEmails(emails)}
                            title="Copy these addresses so you can chase them in one message"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy emails
                          </Button>
                        )}
                      </div>
                      <StudentList students={members} />
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nobody has booked this session yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

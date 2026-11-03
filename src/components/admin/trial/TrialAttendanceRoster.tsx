import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Copy, Download, Mail, Check, Loader2 } from 'lucide-react';
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
 *
 * The two groups now carry the button that acts on them. Reading "8 not asked
 * yet" here and then hunting for those eight rows further down the page was
 * the whole distance between knowing and doing, and it is where the sending
 * stopped happening.
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
  class_language?: string | null;
  student_timezone?: string | null;
  confirmation_token?: string | null;
  attendance_response?: string | null;
  attendance_responded_at?: string | null;
  attendance_email_sent_at?: string | null;
  attendance_followup_manual_at?: string | null;
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

/**
 * The same 48-hour floor the per-row button enforces. Three letters in two
 * days is how a domain earns a spam complaint, and this button can produce
 * them a dozen at a time.
 */
const RESEND_GUARD_MS = 48 * 60 * 60 * 1000;

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

/** "14 Sep, 18:42" — enough to see how long ago without a full timestamp. */
const shortStamp = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const askedTooRecently = (b: RosterBooking) =>
  !!b.attendance_email_sent_at &&
  Date.now() - new Date(b.attendance_email_sent_at).getTime() < RESEND_GUARD_MS;

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

/**
 * The one line under a name that says where this student stands in time.
 *
 * Asked, answered and chased-by-hand are three different events and a single
 * "last activity" date would hide which one happened. They are shown as they
 * are, in the order they occur.
 */
function StudentTimeline({ s, group }: { s: RosterBooking; group: GroupKey }) {
  const bits: string[] = [];
  if (s.attendance_email_sent_at) bits.push(`asked ${shortStamp(s.attendance_email_sent_at)}`);
  if (s.attendance_followup_manual_at)
    bits.push(`chased ${shortStamp(s.attendance_followup_manual_at)}`);
  if ((group === 'coming' || group === 'declined') && s.attendance_responded_at)
    bits.push(`answered ${shortStamp(s.attendance_responded_at)}`);
  if (bits.length === 0) return null;
  return <span className="text-[11px] text-muted-foreground/80">{bits.join(' · ')}</span>;
}

export default function TrialAttendanceRoster() {
  const queryClient = useQueryClient();
  // Which bulk action is in flight, keyed so two sessions can be told apart.
  const [busy, setBusy] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'trial-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'trial-slots'] });
  };

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

  /**
   * Ask a whole group whether they are coming.
   *
   * Sent one at a time on purpose. A dozen parallel invocations of the mail
   * function is a burst that looks like exactly what a new sending domain must
   * not look like, and a serial loop also lets a single failure be reported
   * with the address it belongs to instead of collapsing into "some failed".
   *
   * Each send is stamped immediately after it succeeds rather than in one
   * update at the end, so a browser closed mid-run leaves a record that is
   * short, not wrong: everyone already written to is marked, and the rest
   * simply stay unasked.
   */
  const askGroup = async (
    key: string,
    slot: { trial_date: string | null; start_time: string; id: string },
    members: RosterBooking[],
    mode: 'first' | 'again',
  ) => {
    const targets = mode === 'again' ? members.filter((m) => !askedTooRecently(m)) : members;
    const held = members.length - targets.length;

    if (targets.length === 0) {
      toast({
        title: 'Nothing to send',
        description: `All ${members.length} were asked within the last 48 hours. Give them a day.`,
      });
      return;
    }

    setBusy(key);
    try {
      const { data: slotRow, error: slotErr } = await supabase
        .from('trial_slots')
        .select('meeting_url, class_language, timezone, duration_min')
        .eq('id', slot.id)
        .maybeSingle();
      if (slotErr) throw slotErr;
      const s = slotRow as {
        meeting_url?: string | null;
        class_language?: string | null;
        timezone?: string | null;
        duration_min?: number | null;
      } | null;

      // The same rule the per-row button and the batch both enforce: a letter
      // that cannot be joined is worse than no letter.
      if (!s?.meeting_url) {
        toast({
          title: 'No Google Meet link on this session',
          description: 'Add it in the trial slot settings before asking anyone to confirm.',
          variant: 'destructive',
        });
        return;
      }

      let sent = 0;
      const failures: string[] = [];

      for (const b of targets) {
        if (!b.email) {
          failures.push('(a booking with no email address)');
          continue;
        }
        if (!b.confirmation_token) {
          // Without a token the letter has no confirm or decline button, so it
          // asks a question the reader cannot answer.
          failures.push(`${b.email} — no confirmation token`);
          continue;
        }
        const lang = s.class_language ?? b.class_language ?? 'en';
        const emailLang = lang === 'arabic' ? 'ar' : lang === 'english' ? 'en' : lang;
        try {
          const { error: mailErr } = await supabase.functions.invoke('send-confirmation-email', {
            body: {
              template: 'trial_attendance_confirmation',
              email: b.email,
              name: b.name || b.email,
              language: emailLang,
              trial_date: b.trial_date,
              trial_time: b.start_time,
              trial_timezone: s.timezone ?? undefined,
              student_timezone: b.student_timezone ?? null,
              trial_duration_min: s.duration_min ?? 30,
              level: b.level ?? undefined,
              class_link_url: s.meeting_url,
              booking_id: b.id,
              confirmation_token: b.confirmation_token,
            },
          });
          if (mailErr) throw mailErr;

          const { error: stampErr } = await supabase
            .from('trial_bookings')
            .update({ attendance_email_sent_at: new Date().toISOString() } as any)
            .eq('id', b.id);
          // The letter is delivered either way; only our record of it failed.
          // Counting it as sent is the honest reading, and the warning says
          // which one to check.
          if (stampErr) failures.push(`${b.email} — sent, but the timestamp did not save`);
          sent += 1;
        } catch (err: any) {
          failures.push(`${b.email} — ${err?.message ?? 'send failed'}`);
        }
      }

      if (failures.length === 0) {
        toast({
          title: mode === 'first' ? `Asked ${sent}` : `Chased ${sent}`,
          description: held > 0 ? `${held} skipped — asked less than 48 hours ago.` : undefined,
        });
      } else {
        toast({
          title: `${sent} sent, ${failures.length} did not`,
          description: failures.slice(0, 4).join(' · '),
          variant: 'destructive',
        });
      }
      refresh();
    } catch (err: any) {
      toast({ title: 'Could not send', description: err?.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  /**
   * Record a chase that happened outside the system — a WhatsApp message, a
   * phone call. Without this the roster quietly claims nobody has followed up,
   * and the same student gets chased twice by two different routes.
   */
  const markChased = async (b: RosterBooking) => {
    setMarkingId(b.id);
    try {
      const { error } = await supabase
        .from('trial_bookings')
        .update({ attendance_followup_manual_at: new Date().toISOString() } as any)
        .eq('id', b.id);
      if (error) throw error;
      toast({ title: 'Marked as chased', description: b.email ?? b.name ?? '' });
      refresh();
    } catch (err: any) {
      toast({ title: 'Could not record it', description: err?.message, variant: 'destructive' });
    } finally {
      setMarkingId(null);
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
        formatStamp(s.attendance_followup_manual_at),
      ]),
    );
    exportCSV(
      ['Name', 'Email', 'Phone', 'Level', 'Answer', 'Answered at', 'Asked at', 'Chased by hand at'],
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
          the letter has not gone out. Both groups can be sent to from here.
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
                <p className={`text-xs font-medium ${meetsMin ? 'text-green-700' : 'text-destructive'}`}>
                  {meetsMin ? 'Runs: ' : 'Short: '}
                  needs {slot.min_to_run} to run — has {yes}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {(['coming', 'declined', 'no_reply', 'not_asked'] as GroupKey[]).map((key) => {
                  const members = groups[key];
                  if (members.length === 0) return null;
                  const emails = members.map((m) => m.email).filter((e): e is string => !!e);
                  const actionKey = `${slot.id}:${key}`;
                  const running = busy === actionKey;
                  const sendable = members.filter((m) => !!m.confirmation_token);
                  const dueNow =
                    key === 'no_reply' ? sendable.filter((m) => !askedTooRecently(m)) : sendable;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {GROUP_LABELS[key]} ({members.length})
                        </h4>

                        {/* The first letter, for a group that has never had one. */}
                        {key === 'not_asked' && sendable.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            disabled={running || busy !== null}
                            onClick={() => askGroup(actionKey, slot, sendable, 'first')}
                            title="Send the attendance letter to everyone in this group"
                          >
                            {running ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Mail className="h-3 w-3 mr-1" />
                            )}
                            Ask all {sendable.length}
                          </Button>
                        )}

                        {/* The chase, for a group that had one and ignored it. */}
                        {key === 'no_reply' && sendable.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            disabled={running || busy !== null || dueNow.length === 0}
                            onClick={() => askGroup(actionKey, slot, sendable, 'again')}
                            title={
                              dueNow.length === 0
                                ? 'Everyone here was asked within the last 48 hours'
                                : 'Send the letter again to everyone who has not replied'
                            }
                          >
                            {running ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Mail className="h-3 w-3 mr-1" />
                            )}
                            Ask again ({dueNow.length})
                          </Button>
                        )}

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

                      <ul className="space-y-1">
                        {members.map((s) => (
                          <li key={s.id} className="text-sm leading-tight">
                            <div className="flex items-start gap-1.5">
                              <div className="min-w-0">
                                <span className="text-foreground">{s.name || '(no name)'}</span>{' '}
                                <span className="text-xs text-muted-foreground">
                                  {s.email || '(no email)'}
                                </span>
                                <div>
                                  <StudentTimeline s={s} group={key} />
                                </div>
                              </div>
                              {key === 'no_reply' && !s.attendance_followup_manual_at && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1 text-[10px] shrink-0"
                                  disabled={markingId === s.id}
                                  onClick={() => markChased(s)}
                                  title="I chased this one myself — WhatsApp, a call. Record it here so nobody chases them twice."
                                >
                                  <Check className="h-3 w-3 mr-0.5" />
                                  chased
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
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

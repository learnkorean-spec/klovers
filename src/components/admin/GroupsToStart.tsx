import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, CheckCircle2 } from "lucide-react";

/**
 * Starting a group — the one action nothing in the UI could do.
 *
 * `activate_pkg_group(group_id, start_date)` has been live since migration
 * 20260915120000 and no screen has ever called it. The consequence was not
 * obvious and was expensive: a group with no `start_date` leaves every seated
 * student with no `first_class_date`, and BOTH payment letters read that
 * column to decide who to write to. So the whole payment system — rewritten,
 * deployed and switched on on 15 Sep — could never reach a single person.
 * Eight active groups, none of them started, two seats filled.
 *
 * What starting a group does, in one place so the button is not a mystery:
 *
 *   1. writes `start_date` on the group
 *   2. writes `first_class_date` on every seated student who has not paid
 *   3. writes `due_at` — 23:00 Cairo, three days after that first class
 *   4. which makes letter one go out in the last day before the class, and
 *      letter two at that `due_at`, and nothing after it
 *
 * Paid students are deliberately untouched: they have no deadline left to
 * move.
 *
 * The confirm step is not ceremony. If the date chosen is today or tomorrow,
 * letter one goes out at the next :20 past the hour — a real letter, to a real
 * student, about money. The button says so before it does it.
 */

type GroupRow = {
  id: string;
  title: string;
  /** "Monday 15:00 Cairo" — empty when the NAME already says it. */
  when: string;
  language: string;
  dayOfWeek: number | null;
  startDate: string | null;
  /** Active members — everyone in the room. */
  members: number;
  /** Members linked to an enrolment. Only these can be given a date. */
  seated: number;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

/** Today in Cairo as YYYY-MM-DD. The admin may be anywhere; the school is not. */
function cairoTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * The next time this weekday comes round in Cairo, never today.
 *
 * Offering today as the default would mean a class starting in hours and a
 * payment letter going out within the hour, chosen by a default rather than
 * by Re. The date box is editable if that is genuinely what she wants.
 */
function nextWeekdayISO(dayOfWeek: number | null): string {
  const today = cairoTodayISO();
  if (dayOfWeek == null) return addDaysISO(today, 7);
  const [y, m, d] = today.split("-").map(Number);
  const todayDow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const delta = ((dayOfWeek - todayDow + 7) % 7) || 7;
  return addDaysISO(today, delta);
}

/** "2026-09-21" -> "Monday 21 September". Plain date, never shifted by a zone. */
function prettyDate(iso: string | null): string {
  if (!iso) return "no date";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default function GroupsToStart() {
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [groupsRes, membersRes, pkgRes] = await Promise.all([
        (supabase as any)
          .from("pkg_groups")
          .select("id, name, package_id, start_date, capacity")
          .eq("is_active", true),
        supabase
          .from("pkg_group_members")
          .select("group_id, enrollment_id")
          .eq("member_status", "active"),
        supabase
          .from("schedule_packages")
          .select("id, level, day_of_week, start_time, class_language")
          .eq("is_active", true),
      ]);

      // Thrown, not swallowed. A failed read here would render "every group is
      // already started", which is the one wrong answer this card must never
      // give.
      if (groupsRes.error) throw groupsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (pkgRes.error) throw pkgRes.error;

      const members = new Map<string, { members: number; seated: number }>();
      for (const m of (membersRes.data ?? []) as Array<{ group_id: string; enrollment_id: string | null }>) {
        const t = members.get(m.group_id) ?? { members: 0, seated: 0 };
        t.members += 1;
        if (m.enrollment_id) t.seated += 1;
        members.set(m.group_id, t);
      }

      const packages = new Map(
        ((pkgRes.data ?? []) as Array<{
          id: string; level: string | null; day_of_week: number | null;
          start_time: string | null; class_language: string | null;
        }>).map(p => [p.id, p]),
      );

      const rows: GroupRow[] = ((groupsRes.data ?? []) as Array<{
        id: string; name: string | null; package_id: string | null; start_date: string | null;
      }>).map(g => {
        const p = g.package_id ? packages.get(g.package_id) : undefined;
        const count = members.get(g.id) ?? { members: 0, seated: 0 };
        const title = g.name || "Group";
        // Every group is already named for its slot — "Level 1 · Monday 15:00
        // Cairo" — so repeating the schedule underneath said the same words
        // twice. Kept only for a group whose name does not carry the day.
        const dow = p?.day_of_week ?? null;
        const when = dow != null && !title.includes(DAY_NAMES[dow])
          ? `${DAY_NAMES[dow]} ${hhmm(p?.start_time)} Cairo`
          : "";
        return {
          id: g.id,
          title,
          when,
          language: p?.class_language === "english" ? "English" : "Arabic",
          dayOfWeek: dow,
          startDate: g.start_date,
          members: count.members,
          seated: count.seated,
        };
      });

      // Not started first, and within those the fullest — the group with people
      // waiting in it is the one worth starting.
      rows.sort((a, b) => {
        const aStarted = a.startDate ? 1 : 0;
        const bStarted = b.startDate ? 1 : 0;
        if (aStarted !== bStarted) return aStarted - bStarted;
        if (a.seated !== b.seated) return b.seated - a.seated;
        return a.title.localeCompare(b.title);
      });

      setDates(prev => {
        const next = { ...prev };
        for (const r of rows) if (!next[r.id]) next[r.id] = nextWeekdayISO(r.dayOfWeek);
        return next;
      });
      setGroups(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the groups.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const start = async (g: GroupRow) => {
    const date = dates[g.id] || nextWeekdayISO(g.dayOfWeek);
    setBusyId(g.id);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc("activate_pkg_group", {
        _group_id: g.id,
        _start_date: date,
      });
      if (rpcError) throw rpcError;

      const dated = Number((data as { students?: number } | null)?.students ?? 0);
      toast({
        title: `${g.title} starts ${prettyDate(date)}`,
        description: dated > 0
          ? `${dated} student${dated === 1 ? "" : "s"} now ${dated === 1 ? "has" : "have"} that first class date. ` +
            `Unpaid ones get the payment letter in the day before it, and the last letter at 23:00 Cairo on ${prettyDate(addDaysISO(date, 3))}.`
          : "No student in this group is linked to an enrolment yet, so nobody was given a date and no payment letter will go out.",
      });
      setConfirmId(null);
      await load();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      toast({
        title: "Could not start the group",
        description: msg.includes("not_authorised")
          ? "Only an admin account can start a group."
          : msg,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-5 text-sm">
          <span className="font-semibold text-destructive">Could not load the groups.</span>{" "}
          <span className="text-muted-foreground">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!groups) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No active groups.
        </CardContent>
      </Card>
    );
  }

  const waiting = groups.filter(g => !g.startDate);
  const started = groups.filter(g => g.startDate);
  const today = cairoTodayISO();

  return (
    <div className="space-y-3">
      {waiting.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {waiting.length} group{waiting.length === 1 ? "" : "s"} ha{waiting.length === 1 ? "s" : "ve"} no start date.
          </span>{" "}
          Until a group starts, nobody in it has a first class date and no payment letter can reach them.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Every active group has a start date.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {waiting.map(g => {
          const date = dates[g.id] ?? "";
          const imminent = date !== "" && date <= addDaysISO(today, 1);
          const confirming = confirmId === g.id;
          return (
            <Card key={g.id}>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-semibold">{g.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{g.language}</Badge>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {g.when && <span>{g.when} · </span>}
                  {g.seated > 0
                    ? `${g.seated} of ${g.members} member${g.members === 1 ? "" : "s"} linked to an enrolment`
                    : `${g.members} member${g.members === 1 ? "" : "s"}, none linked to an enrolment`}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={e => {
                      setConfirmId(null);
                      setDates(prev => ({ ...prev, [g.id]: e.target.value }));
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    aria-label={`First class date for ${g.title}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={confirming ? "destructive" : "default"}
                    className="h-8"
                    disabled={busyId === g.id || !date}
                    onClick={() => (confirming ? void start(g) : setConfirmId(g.id))}
                  >
                    {busyId === g.id
                      ? "Starting…"
                      : confirming
                        ? "Confirm — this dates students"
                        : "Start this group"}
                  </Button>
                </div>

                {confirming && (
                  <p className="text-[11px] text-muted-foreground">
                    First class {prettyDate(date)}. Payment due 23:00 Cairo on {prettyDate(addDaysISO(date, 3))}.
                    {g.seated === 0
                      ? " Nobody here is linked to an enrolment, so no letter goes out."
                      : imminent
                        ? " The payment letter goes out within the hour."
                        : " The payment letter goes out the day before the class."}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {started.length > 0 && (
        <div className="space-y-1 pt-1">
          {started.map(g => (
            <p key={g.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold text-foreground">{g.title}</span>
              <span>started {prettyDate(g.startDate)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

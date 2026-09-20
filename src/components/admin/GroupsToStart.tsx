import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, CheckCircle2, Pencil, UserPlus } from "lucide-react";
import { normalizeLevel } from "@/constants/levels";

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
 *
 * --- 2026-09-21 additions ---
 *
 * `activate_pkg_group` never checked capacity — starting a half-empty group
 * has always been legal at the database layer. The thing actually missing was
 * that this screen only ever loaded `is_active = true` groups, so a group
 * created inactive (no room assigned yet, or created by hand) never showed up
 * here to be started at all. Groups now load regardless of `is_active`; the
 * button already both activates and starts them, so nothing else changed.
 *
 * Two more gaps closed at the same time: the day/time a group meets was fixed
 * once its `schedule_packages` row was created, and there was no way to seat
 * a specific student into a specific group by hand — only the auto-matcher's
 * package-driven assignment, which picks (or creates) a group itself and does
 * the wrong thing for a group that isn't active yet. Both are additive; the
 * existing package_id -> single group mapping (checked before shipping this)
 * makes editing a package's day/time here safe — it only ever affects the one
 * group.
 */

type Candidate = {
  /** Null for someone who only has an account (profiles row) — no enrolment
   * to hang a payment date on yet. She can still be seated in the group; she
   * just won't get dated/billed until an enrolment exists for her. */
  enrollmentId: string | null;
  userId: string;
  name: string;
  email: string;
  level: string | null;
};

type GroupRow = {
  id: string;
  packageId: string | null;
  title: string;
  /** "Monday 15:00 Cairo" — empty when the NAME already says it. */
  when: string;
  language: string;
  level: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  startDate: string | null;
  isActive: boolean;
  capacity: number | null;
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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Inline "edit day/time" state — at most one card open at once.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDay, setEditDay] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Inline "add student" state — at most one card open at once.
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addFilter, setAddFilter] = useState("");
  const [addingBusy, setAddingBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [groupsRes, membersRes, pkgRes, enrollRes, profilesRes] = await Promise.all([
        // No `.eq("is_active", true)` here on purpose — see the 2026-09-21
        // note above. A group that was never activated still needs to be
        // seen and started from this screen, not just the already-active
        // ones.
        (supabase as any)
          .from("pkg_groups")
          .select("id, name, package_id, start_date, capacity, is_active"),
        supabase
          .from("pkg_group_members")
          .select("group_id, user_id, enrollment_id")
          .eq("member_status", "active"),
        supabase
          .from("schedule_packages")
          .select("id, level, day_of_week, start_time, class_language"),
        // Pool one: approved, not yet matched to any group, not slot-rejected.
        // Same definition the auto-matcher (GroupMatcher.tsx) uses for its own
        // unmatched list. Adding one of these also updates her enrolment, so
        // she gets dated/billed when the group starts.
        supabase
          .from("enrollments")
          .select("id, user_id, level")
          .eq("approval_status", "APPROVED")
          .eq("plan_type", "group")
          .is("matched_at", null)
          .is("slot_rejection_reason", null),
        // Pool two: everyone who has an account at all (profiles), for a
        // student like Aya who took a trial and was marked active without any
        // enrolment ever being created for her — the `enrollments` pool above
        // can't see her, but she's a real student and needs to be seatable.
        // Filtered down to "not already in a group" below, once we know who
        // that is.
        supabase
          .from("profiles")
          .select("user_id, name, email, course_level_key"),
      ]);

      // Thrown, not swallowed. A failed read here would render "every group is
      // already started", which is the one wrong answer this card must never
      // give.
      if (groupsRes.error) throw groupsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (pkgRes.error) throw pkgRes.error;
      if (enrollRes.error) throw enrollRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const members = new Map<string, { members: number; seated: number }>();
      const seatedUserIds = new Set<string>();
      for (const m of (membersRes.data ?? []) as Array<{ group_id: string; user_id: string; enrollment_id: string | null }>) {
        const t = members.get(m.group_id) ?? { members: 0, seated: 0 };
        t.members += 1;
        if (m.enrollment_id) t.seated += 1;
        members.set(m.group_id, t);
        seatedUserIds.add(m.user_id);
      }

      const packages = new Map(
        ((pkgRes.data ?? []) as Array<{
          id: string; level: string | null; day_of_week: number | null;
          start_time: string | null; class_language: string | null;
        }>).map(p => [p.id, p]),
      );

      const rows: GroupRow[] = ((groupsRes.data ?? []) as Array<{
        id: string; name: string | null; package_id: string | null; start_date: string | null;
        capacity: number | null; is_active: boolean;
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
          packageId: g.package_id,
          title,
          when,
          language: p?.class_language === "english" ? "English" : "Arabic",
          level: p?.level ?? null,
          dayOfWeek: dow,
          startTime: p?.start_time ?? null,
          startDate: g.start_date,
          isActive: g.is_active,
          capacity: g.capacity,
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

      // Enrich pool one (enrolments) with names/emails.
      const enrollRows = (enrollRes.data ?? []) as Array<{ id: string; user_id: string; level: string | null }>;
      const enrollUserIds = [...new Set(enrollRows.map(e => e.user_id))];
      let profileMap = new Map<string, { name: string; email: string }>();
      if (enrollUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", enrollUserIds);
        profileMap = new Map(
          ((profiles ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>)
            .map(p => [p.user_id, { name: p.name || "Unnamed", email: p.email || "" }]),
        );
      }
      const fromEnrollments: Candidate[] = enrollRows.map(e => ({
        enrollmentId: e.id,
        userId: e.user_id,
        level: e.level,
        name: profileMap.get(e.user_id)?.name ?? "Unnamed",
        email: profileMap.get(e.user_id)?.email ?? "",
      }));

      // Pool two: accounts with no enrolment at all, and not already seated
      // anywhere. This is what makes someone like Aya findable here.
      const alreadyCovered = new Set([...seatedUserIds, ...fromEnrollments.map(c => c.userId)]);
      const fromProfiles: Candidate[] = ((profilesRes.data ?? []) as Array<{
        user_id: string; name: string | null; email: string | null; course_level_key: string | null;
      }>)
        .filter(p => !alreadyCovered.has(p.user_id))
        .map(p => ({
          enrollmentId: null,
          userId: p.user_id,
          level: p.course_level_key,
          name: p.name || "Unnamed",
          email: p.email || "",
        }));

      setCandidates([...fromEnrollments, ...fromProfiles]);

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

  const openEdit = (g: GroupRow) => {
    setEditingId(g.id);
    setEditDay(g.dayOfWeek != null ? String(g.dayOfWeek) : "");
    setEditTime(hhmm(g.startTime) || "15:00");
  };

  const saveEdit = async (g: GroupRow) => {
    if (!g.packageId) {
      toast({ title: "No schedule to edit", description: "This group has no linked schedule package.", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const { error: updErr } = await supabase
        .from("schedule_packages")
        .update({ day_of_week: Number(editDay), start_time: `${editTime}:00` })
        .eq("id", g.packageId);
      if (updErr) throw updErr;
      toast({ title: "Day and time updated", description: `${g.title} now meets ${DAY_NAMES[Number(editDay)]} ${editTime} Cairo.` });
      setEditingId(null);
      // The chosen start date was picked against the old weekday — drop it so
      // it recomputes against the new one instead of silently staying wrong.
      setDates(prev => {
        const next = { ...prev };
        delete next[g.id];
        return next;
      });
      await load();
    } catch (e: any) {
      toast({ title: "Could not update the schedule", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const addStudent = async (g: GroupRow, c: Candidate) => {
    setAddingBusy(true);
    try {
      // Direct insert, not the auto-matcher's assign_student_to_group RPC:
      // that RPC picks (or silently creates) a group for a package, which is
      // exactly wrong here — the admin already chose this exact group,
      // active or not.
      const { error: insErr } = await supabase
        .from("pkg_group_members")
        .upsert(
          { group_id: g.id, user_id: c.userId, enrollment_id: c.enrollmentId, member_status: "active" },
          { onConflict: "group_id,user_id" },
        );
      if (insErr) throw insErr;

      // Only an enrolment-backed add touches `enrollments` — someone with no
      // enrolment (an account-only candidate) has no row here to update, and
      // stays undated until an enrolment is created for her separately.
      if (c.enrollmentId) {
        const { error: enrollErr } = await supabase
          .from("enrollments")
          .update({ matched_at: new Date().toISOString(), slot_id: g.packageId })
          .eq("id", c.enrollmentId);
        if (enrollErr) throw enrollErr;
      }

      toast({
        title: `${c.name} added to ${g.title}`,
        description: c.enrollmentId
          ? undefined
          : "She has no enrolment yet, so starting the group won't date or bill her until one exists.",
      });
      setAddingId(null);
      setAddFilter("");
      await load();
    } catch (e: any) {
      toast({ title: "Could not add that student", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setAddingBusy(false);
    }
  };

  const candidatesFor = useMemo(() => {
    return (g: GroupRow) => {
      const wantLevel = g.level ? normalizeLevel(g.level) : null;
      const q = addFilter.trim().toLowerCase();
      return candidates
        .filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        .sort((a, b) => {
          // Same-level candidates first; alphabetical within each group.
          const aMatch = wantLevel && normalizeLevel(a.level ?? "") === wantLevel ? 0 : 1;
          const bMatch = wantLevel && normalizeLevel(b.level ?? "") === wantLevel ? 0 : 1;
          if (aMatch !== bMatch) return aMatch - bMatch;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 25);
    };
  }, [candidates, addFilter]);

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
          No groups.
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
          Starting is allowed at any headcount — nothing here waits for the group to fill up.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Every group has a start date.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {waiting.map(g => {
          const date = dates[g.id] ?? "";
          const isPast = date !== "" && date < today;
          const imminent = date !== "" && date <= addDaysISO(today, 1);
          const confirming = confirmId === g.id;
          const editing = editingId === g.id;
          const adding = addingId === g.id;
          return (
            <Card key={g.id}>
              <CardContent className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-semibold">{g.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{g.language}</Badge>
                  {!g.isActive && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                      not active yet
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {g.when && <span>{g.when} · </span>}
                  {g.seated > 0
                    ? `${g.seated} of ${g.members} member${g.members === 1 ? "" : "s"} linked to an enrolment`
                    : `${g.members} member${g.members === 1 ? "" : "s"}, none linked to an enrolment`}
                  {g.capacity != null && <span> · capacity {g.capacity}</span>}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    // No `min` here on purpose: a class that already met — the
                    // trial or first session happened before anyone got round
                    // to starting the group in this screen — needs to be
                    // dated for when it actually happened, not forced into the
                    // future. Backdating just means `due_at` (3 days after)
                    // may itself already be past, which is correct, not a bug.
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => (editing ? setEditingId(null) : openEdit(g))}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Day & time
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      if (adding) { setAddingId(null); return; }
                      setAddingId(g.id);
                      setAddFilter("");
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Add student
                  </Button>
                </div>

                {confirming && (
                  <p className="text-[11px] text-muted-foreground">
                    {isPast ? "Recording a class that already happened: " : "First class "}
                    {prettyDate(date)}. Payment due 23:00 Cairo on {prettyDate(addDaysISO(date, 3))}.
                    {g.seated === 0
                      ? " Nobody here is linked to an enrolment, so no letter goes out."
                      : isPast
                        ? " That deadline may already be past — the payment letter goes out on the next run after this is saved."
                        : imminent
                          ? " The payment letter goes out within the hour."
                          : " The payment letter goes out the day before the class."}
                  </p>
                )}

                {editing && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-muted/30 p-2">
                    <Select value={editDay} onValueChange={setEditDay}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((d, i) => (
                          <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="time"
                      value={editTime}
                      onChange={e => setEditTime(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      aria-label={`Class time for ${g.title}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      disabled={savingEdit || !editDay || !editTime}
                      onClick={() => void saveEdit(g)}
                    >
                      {savingEdit ? "Saving…" : "Save"}
                    </Button>
                    <p className="w-full text-[10px] text-muted-foreground">
                      Changes only this group's slot. Existing members and their dates aren't touched.
                    </p>
                  </div>
                )}

                {adding && (
                  <div className="space-y-1.5 rounded-md border border-input bg-muted/30 p-2">
                    <Input
                      value={addFilter}
                      onChange={e => setAddFilter(e.target.value)}
                      placeholder="Filter by name or email…"
                      className="h-8 text-xs"
                      autoFocus
                    />
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {candidatesFor(g).length === 0 && (
                        <p className="px-1 py-1 text-[11px] text-muted-foreground">
                          No student{addFilter ? " matches that filter" : " available to add — everyone with an account is already seated somewhere"}.
                        </p>
                      )}
                      {candidatesFor(g).map(c => (
                        <button
                          key={c.userId}
                          type="button"
                          disabled={addingBusy}
                          onClick={() => void addStudent(g, c)}
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-accent disabled:opacity-50"
                        >
                          <span className="truncate">{c.name} <span className="text-muted-foreground">· {c.email}</span></span>
                          <span className="ml-2 flex shrink-0 gap-1">
                            {g.level && normalizeLevel(c.level ?? "") === normalizeLevel(g.level) && (
                              <Badge variant="secondary" className="text-[9px]">level match</Badge>
                            )}
                            {!c.enrollmentId && (
                              <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">
                                no enrolment
                              </Badge>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
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

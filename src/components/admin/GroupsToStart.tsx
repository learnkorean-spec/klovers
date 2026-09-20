import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, CheckCircle2, Pencil, UserPlus, UserMinus, Users } from "lucide-react";
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
 * Four more gaps closed at the same time:
 *   - the day/time a group meets was fixed once its `schedule_packages` row
 *     was created — now editable per group (safe: every package maps to
 *     exactly one group, checked before shipping this);
 *   - there was no way to seat a specific student into a specific group by
 *     hand — only the auto-matcher's package-driven assignment, which picks
 *     or creates a group itself and does the wrong thing for one that isn't
 *     active yet;
 *   - the add-student pool only covered enrolments, so a real student with an
 *     account but no enrolment (e.g. marked active straight from a trial)
 *     couldn't be found at all;
 *   - the date box refused anything before "today", which blocked recording a
 *     class that had already happened by the time anyone opened this screen;
 *   - and there was no way to move a student who was already seated
 *     somewhere into a different group — "Remove" below still unseats her by
 *     hand, but "Add student" now also shows every already-seated lead
 *     (badged with wherever she currently sits) instead of hiding anyone not
 *     free, and picking her there moves her in one step: unseated from the
 *     old group, seated in this one. The two-step remove-then-add still
 *     works and is what "Remove" alone does, but a real class change no
 *     longer needs it — Aya, seated in Hangul · Friday, was invisible from
 *     every other group's "Add student" for exactly this reason.
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
  /** Set when she's already seated in some other group. Adding her from a
   * different group's list is then a move, not a fresh seat — see
   * `addStudent` below. Null means she isn't seated anywhere yet. */
  currentGroupId: string | null;
  currentGroupTitle: string | null;
};

type Member = {
  userId: string;
  enrollmentId: string | null;
  name: string;
  email: string;
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
  members: Member[];
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

/**
 * Offset of a timezone from UTC, in minutes, on a specific instant — DST
 * safe. `Intl` won't hand you an offset directly, so this reads it back out
 * of a formatted "GMT+3" string.
 */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }).formatToParts(date);
  const raw = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT+0";
  const m = raw.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return 0;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  return h * 60 + (h < 0 ? -min : min);
}

/**
 * A class's day/time is always entered and stored as Cairo wall-clock time
 * (every `schedule_packages` row is timezone Africa/Cairo). The teacher
 * scheduling it works from Thailand, so the same instant is shown back in
 * Asia/Bangkok — accounting for Cairo's DST (Egypt resumed it in 2023),
 * which Bangkok never observes, so the gap isn't a fixed number of hours
 * year-round.
 */
function cairoToBangkok(dayOfWeek: number | null, hhmmStr: string): { day: string; time: string } | null {
  if (dayOfWeek == null || !hhmmStr) return null;
  const isoDate = nextWeekdayISO(dayOfWeek);
  const guessUTC = new Date(`${isoDate}T${hhmmStr}:00Z`);
  const cairoOffset = tzOffsetMinutes(guessUTC, "Africa/Cairo");
  const actualUTC = new Date(guessUTC.getTime() - cairoOffset * 60000);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "long" }).format(actualUTC);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(actualUTC);
  return { day, time };
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

  // Inline "members / remove" state — at most one card open at once.
  const [membersOpenId, setMembersOpenId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

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

      // Names/emails for whoever is already seated somewhere — used both for
      // this group's own member list and to exclude them from candidate pools
      // built further down.
      const memberRows = (membersRes.data ?? []) as Array<{ group_id: string; user_id: string; enrollment_id: string | null }>;
      const memberUserIds = [...new Set(memberRows.map(m => m.user_id))];
      let memberProfileMap = new Map<string, { name: string; email: string }>();
      if (memberUserIds.length > 0) {
        const { data: memberProfiles, error: memberProfilesErr } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", memberUserIds);
        if (memberProfilesErr) throw memberProfilesErr;
        memberProfileMap = new Map(
          ((memberProfiles ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>)
            .map(p => [p.user_id, { name: p.name || "Unnamed", email: p.email || "" }]),
        );
      }

      const membersByGroup = new Map<string, Member[]>();
      const seatedCountByGroup = new Map<string, number>();
      for (const m of memberRows) {
        const list = membersByGroup.get(m.group_id) ?? [];
        list.push({
          userId: m.user_id,
          enrollmentId: m.enrollment_id,
          name: memberProfileMap.get(m.user_id)?.name ?? "Unnamed",
          email: memberProfileMap.get(m.user_id)?.email ?? "",
        });
        membersByGroup.set(m.group_id, list);
        if (m.enrollment_id) seatedCountByGroup.set(m.group_id, (seatedCountByGroup.get(m.group_id) ?? 0) + 1);
      }

      const packages = new Map(
        ((pkgRes.data ?? []) as Array<{
          id: string; level: string | null; day_of_week: number | null;
          start_time: string | null; class_language: string | null;
        }>).map(p => [p.id, p]),
      );

      // Which group (if any) each user is currently seated in, and that
      // group's display title — used to mark and move already-seated
      // candidates rather than hide them (see the 2026-09-21 note below).
      const groupTitleById = new Map(
        ((groupsRes.data ?? []) as Array<{ id: string; name: string | null }>).map(g => [g.id, g.name || "Group"]),
      );
      const groupIdByUserId = new Map<string, string>();
      for (const m of memberRows) if (!groupIdByUserId.has(m.user_id)) groupIdByUserId.set(m.user_id, m.group_id);

      const rows: GroupRow[] = ((groupsRes.data ?? []) as Array<{
        id: string; name: string | null; package_id: string | null; start_date: string | null;
        capacity: number | null; is_active: boolean;
      }>).map(g => {
        const p = g.package_id ? packages.get(g.package_id) : undefined;
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
          members: membersByGroup.get(g.id) ?? [],
          seated: seatedCountByGroup.get(g.id) ?? 0,
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
      let enrollProfileMap = new Map<string, { name: string; email: string }>();
      if (enrollUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", enrollUserIds);
        enrollProfileMap = new Map(
          ((profiles ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>)
            .map(p => [p.user_id, { name: p.name || "Unnamed", email: p.email || "" }]),
        );
      }
      const fromEnrollments: Candidate[] = enrollRows.map(e => {
        const currentGroupId = groupIdByUserId.get(e.user_id) ?? null;
        return {
          enrollmentId: e.id,
          userId: e.user_id,
          level: e.level,
          name: enrollProfileMap.get(e.user_id)?.name ?? "Unnamed",
          email: enrollProfileMap.get(e.user_id)?.email ?? "",
          currentGroupId,
          currentGroupTitle: currentGroupId ? groupTitleById.get(currentGroupId) ?? "another group" : null,
        };
      });

      // Pool two: every other account, including ones already seated
      // somewhere — a seated lead is marked (badge below) and picking her
      // moves her rather than being hidden, which is what made someone like
      // Aya, already seated in her real group, invisible from every other
      // group's "Add student" list. Only excluded here: anyone already
      // covered by pool one, to avoid listing her twice.
      const enrollmentUserIds = new Set(fromEnrollments.map(c => c.userId));
      const fromProfiles: Candidate[] = ((profilesRes.data ?? []) as Array<{
        user_id: string; name: string | null; email: string | null; course_level_key: string | null;
      }>)
        .filter(p => !enrollmentUserIds.has(p.user_id))
        .map(p => {
          const currentGroupId = groupIdByUserId.get(p.user_id) ?? null;
          return {
            enrollmentId: null,
            userId: p.user_id,
            level: p.course_level_key,
            name: p.name || "Unnamed",
            email: p.email || "",
            currentGroupId,
            currentGroupTitle: currentGroupId ? groupTitleById.get(currentGroupId) ?? "another group" : null,
          };
        });

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
      // If she's already seated somewhere else, unseat her there first — this
      // is the one-step "move" that a real class change needs. Her old
      // enrolment link isn't cleared to null here the way a plain Remove does
      // it, because the very next statement points it at this group instead.
      if (c.currentGroupId && c.currentGroupId !== g.id) {
        const { error: delErr } = await supabase
          .from("pkg_group_members")
          .delete()
          .eq("group_id", c.currentGroupId)
          .eq("user_id", c.userId);
        if (delErr) throw delErr;
      }

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

      const moved = c.currentGroupId && c.currentGroupId !== g.id;
      toast({
        title: moved ? `${c.name} moved to ${g.title}` : `${c.name} added to ${g.title}`,
        description: moved
          ? `Unseated from ${c.currentGroupTitle} and seated here instead.`
          : c.enrollmentId
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

  /**
   * Unseats a student from this group. If she's enrolment-backed, that
   * enrolment is reopened (`matched_at`/`slot_id` cleared) so she reappears in
   * pool one and is immediately pickable via "Add student" on whatever group
   * she's actually moving to — this plus a subsequent add is how "move a
   * student to a different group" works, since a class change is common
   * enough that a straight remove-then-add beats a dedicated move dialog for
   * how rarely each half is used alone.
   */
  const removeMember = async (g: GroupRow, m: Member) => {
    setRemovingUserId(m.userId);
    try {
      const { error: delErr } = await supabase
        .from("pkg_group_members")
        .delete()
        .eq("group_id", g.id)
        .eq("user_id", m.userId);
      if (delErr) throw delErr;

      if (m.enrollmentId) {
        const { error: enrollErr } = await supabase
          .from("enrollments")
          .update({ matched_at: null, slot_id: null })
          .eq("id", m.enrollmentId);
        if (enrollErr) throw enrollErr;
      }

      toast({
        title: `${m.name} removed from ${g.title}`,
        description: "She's now unseated and can be added to a different group from its own \"Add student\" list.",
      });
      await load();
    } catch (e: any) {
      toast({ title: "Could not remove that student", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setRemovingUserId(null);
    }
  };

  const candidatesFor = useMemo(() => {
    return (g: GroupRow) => {
      const wantLevel = g.level ? normalizeLevel(g.level) : null;
      const q = addFilter.trim().toLowerCase();
      return candidates
        // Already a member of this exact group — nothing to add.
        .filter(c => c.currentGroupId !== g.id)
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
          const membersOpen = membersOpenId === g.id;
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
                  {(() => {
                    const bkk = cairoToBangkok(g.dayOfWeek, hhmm(g.startTime));
                    return bkk ? <span>{bkk.day} {bkk.time} Bangkok for you · </span> : null;
                  })()}
                  {g.seated > 0
                    ? `${g.seated} of ${g.members.length} member${g.members.length === 1 ? "" : "s"} linked to an enrolment`
                    : `${g.members.length} member${g.members.length === 1 ? "" : "s"}, none linked to an enrolment`}
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
                  {g.members.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setMembersOpenId(membersOpen ? null : g.id)}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" /> Members ({g.members.length})
                    </Button>
                  )}
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
                    {editDay && editTime && (() => {
                      const bkk = cairoToBangkok(Number(editDay), editTime);
                      return bkk ? (
                        <p className="w-full text-[11px] font-medium text-foreground">
                          = {bkk.day} {bkk.time} for you in Bangkok
                        </p>
                      ) : null;
                    })()}
                    <p className="w-full text-[10px] text-muted-foreground">
                      Time above is Cairo, same as the rest of the schedule. Changes only this group's slot —
                      existing members and their dates aren't touched.
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
                          No student{addFilter ? " matches that filter" : " to add"}.
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
                            {c.currentGroupId && (
                              <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-300">
                                in {c.currentGroupTitle} · click to move
                              </Badge>
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

                {membersOpen && (
                  <div className="space-y-0.5 rounded-md border border-input bg-muted/30 p-2">
                    {g.members.map(m => (
                      <div key={m.userId} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs">
                        <span className="truncate">
                          {m.name} <span className="text-muted-foreground">· {m.email}</span>
                          {!m.enrollmentId && (
                            <Badge variant="outline" className="ml-2 text-[9px] text-amber-600 border-amber-300">
                              no enrolment
                            </Badge>
                          )}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 shrink-0 px-2 text-[11px] text-destructive hover:text-destructive"
                          disabled={removingUserId === m.userId}
                          onClick={() => void removeMember(g, m)}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          {removingUserId === m.userId ? "Removing…" : "Remove"}
                        </Button>
                      </div>
                    ))}
                    <p className="pt-1 text-[10px] text-muted-foreground">
                      Removing just unseats her — to move her to a specific group, it's usually quicker to open
                      that group's "Add student" instead and pick her straight from there; she'll show up badged
                      with wherever she currently sits.
                    </p>
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

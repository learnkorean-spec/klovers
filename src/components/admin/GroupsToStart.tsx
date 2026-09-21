import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, CheckCircle2, Mail, PauseCircle, Pencil, PlayCircle, Radio, UserPlus, UserMinus, Users, Video } from "lucide-react";
import { LEVELS, getLevelShortLabel, normalizeLevel } from "@/constants/levels";
// The welcome letter lives in its own file: see the note on welcomeOpenId.
import GroupWelcomeSender from "./GroupWelcomeSender";

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
 *
 * --- 2026-09-21, later the same day ---
 *
 * Seating anyone into one of those inactive groups still failed outright:
 * `enforce_group_membership_guard` refused any group with `is_active = false`,
 * so "Add student" on "Hangul · Arabic track · Wednesday 15:00 Cairo" threw
 * "this group is not active" — a group this screen lists on purpose, for a
 * button that would have activated it. Migration
 * 20260921140000_seat_into_unstarted_groups narrows that refusal to a group
 * that ran and was THEN switched off; a group that has never started is one
 * being filled, which is what this screen is for.
 *
 * Two things here changed with it.
 *
 * The enrolment a candidate carries is now RESOLVED, not assumed. Pool one
 * below is deliberately only the unmatched enrolments — that is the
 * auto-matcher's queue — so anyone already matched fell through to the
 * profiles pool and arrived with `enrollmentId: null` and a "no enrolment"
 * badge. Aya is the case in hand: a live PAID, APPROVED, group enrolment,
 * matched to her Friday package. Moving her would have written
 * `enrollment_id = null` on the new seat, and that column is the entire link
 * `activate_pkg_group` walks to set `first_class_date` and `due_at`. She
 * would have looked seated and been unreachable by either payment letter.
 * The pool now looks up any live, approved, payable group enrolment for the
 * user, and failing that reuses whatever her current seat is already linked
 * to. Genuinely enrolment-less accounts still show the badge, and it is now
 * true when it shows.
 *
 * And the edit panel covers the group, not just its clock: level, track,
 * capacity, meeting link and the group's own name, alongside day and time.
 * The name is free text because the existing ones do not share a format, with
 * a button that rebuilds it from the schedule so a group renamed by hand
 * cannot keep claiming a Wednesday it no longer meets on.
 *
 * One wrinkle worth knowing about the level dropdown. `constants/levels`
 * says never to write legacy keys, and every `schedule_packages` row on
 * production stores exactly those (`level_1`, `level_2`, …) with `hangul` the
 * only canonical one. Writing `l1` into a table where the other nine rows say
 * `level_1` would put two vocabularies in one column for no gain — every
 * reader normalises anyway. So an edit writes back in the vocabulary that row
 * already uses: legacy stays legacy, canonical stays canonical, and nothing
 * here converts a column it was not asked to convert.
 *
 * --- 2026-09-21, evening: the running classes are here too ---
 *
 * The section was called GROUPS TO START and behaved like it: a group with a
 * start date dropped out of the grid and became a grey one-line footnote.
 * Which meant the classes that actually RUN — the ones with students in them,
 * the ones whose room link or headcount you might need at 3pm — were the
 * groups this screen said the least about. No members list, no Add student,
 * no Edit group, no room.
 *
 * Now every group is a card. A started one shows when it started and when it
 * next meets where an unstarted one shows the date box and the Start button;
 * the rest of the card is identical, so seating a student or fixing a link is
 * the same two clicks whichever kind it is.
 *
 * And the card reads the clock, in Cairo wall-clock time, recomputed every
 * 30 seconds:
 *
 *   - IN CLASS NOW  — mint-strong ring, and a button straight into the room
 *                     when the group has a link;
 *   - later today   — mint tint and the hours left;
 *   - anything else — a plain card.
 *
 * Cards sort by that: live first, then today, then groups still waiting for a
 * start date, then the rest. The green is `mint-strong` (#3ED598) from the
 * brand palette, not a new colour — see claude/BRAND_PALETTE_REFERENCE.md.
 *
 * --- 2026-09-21, the whole card says what the class is ---
 *
 * Restored note first, because this file lost work and should not lose it
 * twice: PR #571 rewrote this file wholesale from a pre-#569 copy and dropped
 * the live/today clock, the room button and the addDaysISO crash fix from
 * #567. This version is #569 with the state work applied ON TOP of it, not
 * instead of it. Edit this file in place; do not regenerate it from an older
 * copy.
 *
 * The clock highlight answers "is this class on right now". It does not
 * answer the question the screen is actually opened for, which is what is
 * running, what is still filling up, and what has stopped. Those are three
 * states of the class itself, and they now colour the whole card border:
 *
 *   RUNNING  green (mint-strong). Started and switched on.
 *   WAITING  amber. No start date yet, with how many more students it needs
 *            to reach `min_to_run`.
 *   PAUSED   pink, with a neon glow. It ran, and was switched off.
 *
 * Paused is a real state, not a deletion: `is_active` goes false and NOTHING
 * else moves — the start date, the members and their `first_class_date` /
 * `due_at` all stay. That is what makes Resume one button. It also means the
 * membership guard (inactive AND started) refuses new seats into it, which is
 * the correct behaviour for a class that is not meeting.
 *
 * The two axes stay separate on purpose: the border is the lifecycle, the
 * tint and glow are the clock. A live class is a green-bordered card with the
 * mint wash on top. A paused class is never "live" whatever its slot says.
 *
 * --- 2026-09-21, unassign from anywhere ---
 *
 * "Remove" lives inside the Members panel, which can only be opened on the
 * group the student is actually in — so taking someone out meant finding that
 * card first, and a paused one sorts to the bottom. Every other group's "Add
 * student" already lists her, badged with where she sits, because clicking
 * her there MOVES her. The Unassign button on that same row is the other
 * half: it takes her out of her current group without seating her anywhere.
 *
 * --- 2026-09-21, the welcome letter ---
 *
 * "Send welcome" writes to everyone seated in the group at once: the class
 * time and room, the book, and what the dashboard answers for her. The panel,
 * the book field and the send loop are in GroupWelcomeSender.tsx, not here —
 * this file is 68 KB and the only write path to it is a whole-file rewrite,
 * which is exactly how it lost work in #571. Put new UI in its own file.
 */

type Candidate = {
  /** Her live enrolment, resolved (see the 2026-09-21 note above) — the
   * matched ones included, because a move must carry the link across.
   * Null only when she really has no enrolment: an account made from a
   * trial, say. She can still be seated; she just won't be dated or billed
   * until an enrolment exists. */
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
  /** When the course welcome letter was sent for THIS seat. Null = never. */
  welcomeSentAt: string | null;
};

type GroupRow = {
  id: string;
  packageId: string | null;
  title: string;
  /** "Monday 15:00 Cairo" — empty when the NAME already says it. */
  when: string;
  language: string;
  /** Raw `class_language` as stored — what the track dropdown edits. */
  languageKey: string;
  /** Raw `schedule_packages.level` as stored, legacy spelling and all. */
  level: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  /** How long the class runs, for deciding whether it is on RIGHT NOW. */
  durationMin: number | null;
  startDate: string | null;
  isActive: boolean;
  capacity: number | null;
  /** Seats needed before the class is worth running. Decides "waiting". */
  minToRun: number;
  meetingUrl: string | null;
  /** The book link that goes in the welcome letter. Typed once per group. */
  bookUrl: string | null;
  members: Member[];
  /** Members linked to an enrolment. Only these can be given a date. */
  seated: number;
};

/** Where a group sits relative to the clock, in Cairo. */
type ClassState = "live" | "today" | "later";

/**
 * What the class IS, as opposed to where the clock has got to.
 *
 *   running  started and switched on — the class is teaching
 *   waiting  no start date yet — still filling up
 *   paused   it ran, and was then switched off. Not deleted: the group, its
 *            members and its slot are all still there, so it can be resumed
 *            with one button.
 *
 * `is_active` on its own never meant "has started" — eight groups are active
 * with no start date — so the pair of columns is what decides this, not
 * either one alone.
 */
type Lifecycle = "running" | "waiting" | "paused";

function lifecycleOf(g: { startDate: string | null; isActive: boolean }): Lifecycle {
  if (!g.startDate) return "waiting";
  return g.isActive ? "running" : "paused";
}

/**
 * The whole card is coloured by lifecycle, because that is the question this
 * screen is opened to answer: what is running, what is still filling up, what
 * has stopped. Green is `mint-strong` (#3ED598) from the brand palette; the
 * pink is kept for paused alone, so a stopped class cannot be mistaken for
 * anything else on the page.
 */
const LIFECYCLE_CARD: Record<Lifecycle, string> = {
  running: "border-2 border-mint-strong",
  waiting: "border-2 border-amber-400 dark:border-amber-500",
  paused: "border-2 border-pink-400 dark:border-pink-500 shadow-[0_0_16px_rgba(244,114,182,0.55)] dark:shadow-[0_0_20px_rgba(244,114,182,0.4)]",
};

const LIFECYCLE_BADGE: Record<Lifecycle, string> = {
  running: "bg-mint-strong text-charcoal hover:bg-mint-strong",
  waiting: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-400",
  paused: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.6)]",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

/** "15:00" / "15:00:00" -> 900 minutes past midnight. Null when unparseable. */
function minutesOfDay(t: string | null | undefined): number | null {
  const m = (t ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return (h % 24) * 60 + min;
}

/**
 * A level key in the vocabulary the row already uses — see the note at the
 * top. `hangul` is the same word either way.
 */
function levelForWrite(canonicalKey: string, current: string | null): string {
  if (canonicalKey === "hangul") return "hangul";
  const isLegacy = !!current && /^level_[0-9]$/.test(current.trim().toLowerCase());
  return isLegacy ? `level_${canonicalKey.replace(/^l/, "")}` : canonicalKey;
}

/** "Level 1 · Arabic track · Monday 15:00 Cairo" — a suggestion, not a rule. */
function suggestName(levelKey: string, day: string, time: string, language: string): string {
  const label = getLevelShortLabel(levelKey) || "Group";
  const track = language === "english" ? "English track" : "Arabic track";
  const dayName = day !== "" ? DAY_NAMES[Number(day)] : "";
  return [label, track, `${dayName} ${time} Cairo`.trim()].filter(Boolean).join(" · ");
}

/** Today in Cairo as YYYY-MM-DD. The admin may be anywhere; the school is not. */
function cairoTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * The weekday (0–6) and minutes-past-midnight it is RIGHT NOW in Cairo.
 *
 * The admin is in Bangkok, five or six hours ahead depending on Cairo's DST,
 * so "is this class on now" cannot be asked of the local clock: for most of
 * her evening it is still the previous Cairo day.
 */
function cairoNowParts(now: Date): { dow: number; minutes: number } {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "long" }).format(now);
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(now);
  return {
    dow: Math.max(0, DAY_NAMES.indexOf(weekday)),
    minutes: minutesOfDay(clock) ?? 0,
  };
}

/**
 * Adds days to a YYYY-MM-DD date.
 *
 * Returns the input untouched when it is not a date it can parse — "" above
 * all, which is what a cleared or not-yet-recomputed date box holds.
 * `Date.UTC(NaN, …)` is an Invalid Date and `.toISOString()` on one throws
 * "Invalid time value", which is not caught anywhere between here and the
 * error boundary: on 21 Sep one empty string blanked the entire page.
 */
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = (iso ?? "").split("-").map(Number);
  if (!y || !m || !d) return iso;
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
  if (Number.isNaN(guessUTC.getTime())) return null;
  const cairoOffset = tzOffsetMinutes(guessUTC, "Africa/Cairo");
  const actualUTC = new Date(guessUTC.getTime() - cairoOffset * 60000);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", weekday: "long" }).format(actualUTC);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(actualUTC);
  return { day, time };
}

/** "in 3h 20m" / "in 45m" — how long until this class starts. */
function untilLabel(minutes: number): string {
  if (minutes <= 0) return "now";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/**
 * "Wednesday · 15:00 Cairo" — the class time as the welcome letter prints it.
 *
 * Written here rather than in the template because the template is handed one
 * string: the day and hour live on the group's schedule slot, which this
 * screen has and the mailer does not. Arabic for an Arabic-track class, since
 * the whole letter is in the class language.
 */
function whenLabel(g: { dayOfWeek: number | null; startTime: string | null; languageKey: string }): string {
  if (g.dayOfWeek == null) return "";
  const isAr = g.languageKey !== "english";
  const day = isAr ? DAY_NAMES_AR[g.dayOfWeek] : DAY_NAMES[g.dayOfWeek];
  const t = hhmm(g.startTime);
  if (!t) return day;
  return isAr ? `${day} · ${t} بتوقيت القاهرة` : `${day} · ${t} Cairo`;
}

export default function GroupsToStart() {
  const [groups, setGroups] = useState<GroupRow[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The clock the live/today highlight is read against. Ticked rather than
  // read once at render: this screen is left open for hours, and a card that
  // says "in 5m" forever is worse than no card at all.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  // Inline "edit group" state — at most one card open at once.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDay, setEditDay] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editLevel, setEditLevel] = useState<string>("");
  const [editLanguage, setEditLanguage] = useState<string>("arabic");
  const [editCapacity, setEditCapacity] = useState<string>("8");
  const [editMeetingUrl, setEditMeetingUrl] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Inline "add student" state — at most one card open at once.
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addFilter, setAddFilter] = useState("");
  const [addingBusy, setAddingBusy] = useState(false);

  // Inline "members / remove" state — at most one card open at once.
  const [membersOpenId, setMembersOpenId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Which card has the welcome sender open. The sender itself is a separate
  // component: this file is already 68 KB and the only write path to it is a
  // whole-file rewrite, so anything that can live outside it should.
  const [welcomeOpenId, setWelcomeOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [groupsRes, membersRes, pkgRes, enrollRes, profilesRes] = await Promise.all([
        // No `.eq("is_active", true)` here on purpose — see the 2026-09-21
        // note above. A group that was never activated still needs to be
        // seen and started from this screen, not just the already-active
        // ones.
        (supabase as any)
          .from("pkg_groups")
          .select("id, name, package_id, start_date, capacity, min_to_run, is_active, meeting_url, book_url"),
        supabase
          .from("pkg_group_members")
          .select("group_id, user_id, enrollment_id, welcome_email_sent_at")
          .eq("member_status", "active"),
        supabase
          .from("schedule_packages")
          .select("id, level, day_of_week, start_time, duration_min, class_language"),
        // Every enrolment the membership guard would accept a seat against:
        // live, approved, group, and either paid or confirmed-unpaid. NOT
        // filtered to `matched_at is null` any more — that is the
        // auto-matcher's queue, and using it as the enrolment lookup is what
        // made an already-matched student like Aya arrive here looking like
        // she had no enrolment at all. The unmatched subset is still taken
        // out of this below, for the "free to seat" pool.
        supabase
          .from("enrollments")
          .select("id, user_id, level, matched_at, created_at")
          .eq("approval_status", "APPROVED")
          .eq("plan_type", "group")
          .is("deleted_at", null)
          .is("slot_rejection_reason", null)
          .in("payment_status", ["PAID", "PENDING_PAYMENT"]),
        // Everyone who has an account at all (profiles), for a student who
        // took a trial and was marked active without any enrolment ever
        // being created for her. Enriched with the enrolment map above where
        // one exists.
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
      const memberRows = (membersRes.data ?? []) as Array<{ group_id: string; user_id: string; enrollment_id: string | null; welcome_email_sent_at: string | null }>;
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
      // What her CURRENT seat is linked to — the last-resort fallback when no
      // enrolment row is found for her, so a move never downgrades a seat
      // that already had a link.
      const seatEnrollmentByUser = new Map<string, string>();
      for (const m of memberRows) {
        const list = membersByGroup.get(m.group_id) ?? [];
        list.push({
          userId: m.user_id,
          enrollmentId: m.enrollment_id,
          name: memberProfileMap.get(m.user_id)?.name ?? "Unnamed",
          email: memberProfileMap.get(m.user_id)?.email ?? "",
          welcomeSentAt: m.welcome_email_sent_at,
        });
        membersByGroup.set(m.group_id, list);
        if (m.enrollment_id) {
          seatedCountByGroup.set(m.group_id, (seatedCountByGroup.get(m.group_id) ?? 0) + 1);
          if (!seatEnrollmentByUser.has(m.user_id)) seatEnrollmentByUser.set(m.user_id, m.enrollment_id);
        }
      }

      const packages = new Map(
        ((pkgRes.data ?? []) as Array<{
          id: string; level: string | null; day_of_week: number | null;
          start_time: string | null; duration_min: number | null; class_language: string | null;
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
        capacity: number | null; min_to_run: number | null; is_active: boolean; meeting_url: string | null; book_url: string | null;
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
          languageKey: p?.class_language === "english" ? "english" : "arabic",
          level: p?.level ?? null,
          dayOfWeek: dow,
          startTime: p?.start_time ?? null,
          durationMin: p?.duration_min ?? null,
          startDate: g.start_date,
          isActive: g.is_active,
          capacity: g.capacity,
          minToRun: g.min_to_run ?? 3,
          meetingUrl: g.meeting_url,
          bookUrl: g.book_url,
          members: membersByGroup.get(g.id) ?? [],
          seated: seatedCountByGroup.get(g.id) ?? 0,
        };
      });

      setDates(prev => {
        const next = { ...prev };
        for (const r of rows) if (!next[r.id]) next[r.id] = nextWeekdayISO(r.dayOfWeek);
        return next;
      });
      setGroups(rows);

      const enrollRows = (enrollRes.data ?? []) as Array<{
        id: string; user_id: string; level: string | null; matched_at: string | null; created_at: string | null;
      }>;

      // One live enrolment per user, newest first. This is the lookup that
      // makes a candidate's `enrollmentId` real rather than a side effect of
      // which pool she happened to come through.
      const liveEnrollmentByUser = new Map<string, { id: string; level: string | null }>();
      for (const e of [...enrollRows].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))) {
        if (!liveEnrollmentByUser.has(e.user_id)) liveEnrollmentByUser.set(e.user_id, { id: e.id, level: e.level });
      }

      // Pool one: approved and not yet matched to any group — the
      // auto-matcher's own unmatched list (GroupMatcher.tsx). Adding one of
      // these also updates her enrolment, so she gets dated/billed when the
      // group starts.
      const unmatched = enrollRows.filter(e => e.matched_at == null);
      const unmatchedUserIds = [...new Set(unmatched.map(e => e.user_id))];
      let enrollProfileMap = new Map<string, { name: string; email: string }>();
      if (unmatchedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", unmatchedUserIds);
        enrollProfileMap = new Map(
          ((profiles ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>)
            .map(p => [p.user_id, { name: p.name || "Unnamed", email: p.email || "" }]),
        );
      }
      const fromEnrollments: Candidate[] = unmatched.map(e => {
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
      // covered by pool one, to avoid listing her twice. Her enrolment is
      // looked up rather than assumed absent — that assumption is what would
      // have unlinked Aya's seat on a move.
      const enrollmentUserIds = new Set(fromEnrollments.map(c => c.userId));
      const fromProfiles: Candidate[] = ((profilesRes.data ?? []) as Array<{
        user_id: string; name: string | null; email: string | null; course_level_key: string | null;
      }>)
        .filter(p => !enrollmentUserIds.has(p.user_id))
        .map(p => {
          const currentGroupId = groupIdByUserId.get(p.user_id) ?? null;
          const live = liveEnrollmentByUser.get(p.user_id) ?? null;
          return {
            enrollmentId: live?.id ?? seatEnrollmentByUser.get(p.user_id) ?? null,
            userId: p.user_id,
            level: live?.level ?? p.course_level_key,
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

  /**
   * Pause a running class, or bring a paused one back.
   *
   * Only `is_active` moves. `start_date`, the members and their
   * `first_class_date`/`due_at` are all left exactly where they are, which is
   * what makes resuming a one-click operation rather than a re-setup: a
   * paused class is a class that stopped meeting, not one that never
   * happened. Pausing also stops new students being seated into it — the
   * membership guard refuses a group that is inactive AND has a start date,
   * which is precisely this state.
   */
  const setPaused = async (g: GroupRow, paused: boolean) => {
    setBusyId(g.id);
    try {
      const { error: updErr } = await supabase
        .from("pkg_groups")
        .update({ is_active: !paused })
        .eq("id", g.id);
      if (updErr) throw updErr;
      toast({
        title: paused ? `${g.title} paused` : `${g.title} resumed`,
        description: paused
          ? "It keeps its start date, its students and their payment dates. Nobody new can be seated into it while it is paused."
          : "Back to running, with everyone who was in it.",
      });
      await load();
    } catch (e: any) {
      toast({ title: paused ? "Could not pause it" : "Could not resume it", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (g: GroupRow) => {
    setEditingId(g.id);
    setEditDay(g.dayOfWeek != null ? String(g.dayOfWeek) : "");
    setEditTime(hhmm(g.startTime) || "15:00");
    setEditLevel(g.level ? normalizeLevel(g.level) : "");
    setEditLanguage(g.languageKey);
    setEditCapacity(String(g.capacity ?? 8));
    setEditMeetingUrl(g.meetingUrl ?? "");
    setEditName(g.title);
  };

  const saveEdit = async (g: GroupRow) => {
    const capacity = Number(editCapacity);
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast({ title: "Capacity must be at least 1", variant: "destructive" });
      return;
    }
    // A capacity below the people already in the room is not a setting, it is
    // a group that is over capacity the moment it saves — and the membership
    // guard would then refuse the next seat with a confusing message.
    if (capacity < g.members.length) {
      toast({
        title: "Capacity is below the headcount",
        description: `${g.members.length} student${g.members.length === 1 ? " is" : "s are"} already in this group. Remove someone first, or set capacity to ${g.members.length} or more.`,
        variant: "destructive",
      });
      return;
    }

    setSavingEdit(true);
    try {
      if (g.packageId) {
        const { error: updErr } = await supabase
          .from("schedule_packages")
          .update({
            day_of_week: Number(editDay),
            start_time: `${editTime}:00`,
            // Same vocabulary the row already stores — see the note at the top.
            ...(editLevel ? { level: levelForWrite(editLevel, g.level) } : {}),
            class_language: editLanguage,
            capacity,
          })
          .eq("id", g.packageId);
        if (updErr) throw updErr;
      }

      const { error: grpErr } = await supabase
        .from("pkg_groups")
        .update({
          name: editName.trim() || g.title,
          capacity,
          meeting_url: editMeetingUrl.trim() || null,
        })
        .eq("id", g.id);
      if (grpErr) throw grpErr;

      toast({
        title: "Group updated",
        description: g.packageId
          ? `${editName.trim() || g.title} now meets ${DAY_NAMES[Number(editDay)]} ${editTime} Cairo, capacity ${capacity}.`
          : `Saved. This group has no linked schedule package, so its day, time, level and track could not be changed here.`,
        variant: g.packageId ? undefined : "destructive",
      });
      setEditingId(null);
      // The chosen start date was picked against the old weekday — drop it so
      // it recomputes against the new one instead of silently staying wrong.
      // The confirm step goes with it: it quotes that date and the deadline
      // three days after it, and leaving it open over a date that no longer
      // exists is what took this whole screen down on 21 Sep.
      setConfirmId(prev => (prev === g.id ? null : prev));
      setDates(prev => {
        const next = { ...prev };
        delete next[g.id];
        return next;
      });
      await load();
    } catch (e: any) {
      toast({ title: "Could not update the group", description: e?.message ?? String(e), variant: "destructive" });
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

  /**
   * Take a student out of whatever group she is sitting in, from any card.
   *
   * "Remove" inside Members can only be reached from the group she is
   * actually in — so unseating someone meant finding that card first, and if
   * it was paused and sorted to the bottom, hunting for it. The same student
   * is already listed in every other group's "Add student" (badged with where
   * she sits, so she can be moved in one click); this is the other half of
   * that: take her out without putting her anywhere.
   *
   * Her enrolment is reopened exactly as Remove does it, so she goes straight
   * back into the free-to-seat pool.
   */
  const unassign = async (c: Candidate) => {
    if (!c.currentGroupId) return;
    setRemovingUserId(c.userId);
    try {
      const { error: delErr } = await supabase
        .from("pkg_group_members")
        .delete()
        .eq("group_id", c.currentGroupId)
        .eq("user_id", c.userId);
      if (delErr) throw delErr;

      if (c.enrollmentId) {
        const { error: enrollErr } = await supabase
          .from("enrollments")
          .update({ matched_at: null, slot_id: null })
          .eq("id", c.enrollmentId);
        if (enrollErr) throw enrollErr;
      }

      toast({
        title: `${c.name} taken out of ${c.currentGroupTitle}`,
        description: "She is not in any group now, and shows up unbadged in every group's Add student list.",
      });
      await load();
    } catch (e: any) {
      toast({ title: "Could not unassign that student", description: e?.message ?? String(e), variant: "destructive" });
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

  /**
   * Where each group sits against the Cairo clock, and how far off its next
   * class is. Only a STARTED group can be in class — an unstarted one meets
   * on paper only, whatever its slot says.
   */
  const clockFor = useMemo(() => {
    const nowParts = cairoNowParts(now);
    return (g: GroupRow): { state: ClassState; minutesUntil: number | null; nextISO: string | null } => {
      const startMin = minutesOfDay(g.startTime);
      if (g.dayOfWeek == null || startMin == null) {
        return { state: "later", minutesUntil: null, nextISO: null };
      }
      const endMin = startMin + (g.durationMin ?? 60);
      const isToday = nowParts.dow === g.dayOfWeek;
      const nextISO = isToday && nowParts.minutes < endMin ? cairoTodayISO() : nextWeekdayISO(g.dayOfWeek);

      if (!g.startDate) return { state: "later", minutesUntil: null, nextISO };
      if (isToday && nowParts.minutes >= startMin && nowParts.minutes < endMin) {
        return { state: "live", minutesUntil: 0, nextISO };
      }
      if (isToday && nowParts.minutes < startMin) {
        return { state: "today", minutesUntil: startMin - nowParts.minutes, nextISO };
      }
      return { state: "later", minutesUntil: null, nextISO };
    };
  }, [now]);

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

  const today = cairoTodayISO();
  const runningCount = groups.filter(g => lifecycleOf(g) === "running").length;
  const pausedCount = groups.filter(g => lifecycleOf(g) === "paused").length;
  const waitingCount = groups.filter(g => !g.startDate).length;
  const liveCount = groups.filter(g => clockFor(g).state === "live").length;
  const todayCount = groups.filter(g => clockFor(g).state === "today").length;

  // What is happening soonest, first. Within a band: the fullest group, then
  // by name, exactly as before.
  const rank = (g: GroupRow) => {
    // A paused class is nobody's next action, so it sits at the bottom
    // whatever its slot says about today.
    if (lifecycleOf(g) === "paused") return 4;
    const s = clockFor(g).state;
    if (s === "live") return 0;
    if (s === "today") return 1;
    return g.startDate ? 3 : 2;
  };
  const ordered = [...groups].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.seated !== b.seated) return b.seated - a.seated;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="text-sm font-semibold text-foreground">{groups.length} classes</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-mint-strong" />
          <span className="text-muted-foreground">{runningCount} running</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-amber-400" />
          <span className="text-muted-foreground">{waitingCount} waiting to fill</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
          <span className="text-muted-foreground">{pausedCount} paused</span>
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {liveCount > 0 && (
          <span className="font-semibold text-foreground">
            {liveCount} class{liveCount === 1 ? " is" : "es are"} on right now.{" "}
          </span>
        )}
        {liveCount === 0 && todayCount > 0 && (
          <span className="font-semibold text-foreground">
            {todayCount} class{todayCount === 1 ? "" : "es"} later today.{" "}
          </span>
        )}
        {waitingCount > 0 ? (
          <>
            <span className="font-semibold text-foreground">
              {waitingCount} group{waitingCount === 1 ? "" : "s"} ha{waitingCount === 1 ? "s" : "ve"} no start date.
            </span>{" "}
            Until a group starts, nobody in it has a first class date and no payment letter can reach them.
            Starting is allowed at any headcount — nothing here waits for the group to fill up.
          </>
        ) : (
          <>Every group has a start date. Running ones are listed here too — same card, same buttons.</>
        )}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {ordered.map(g => {
          const clock = clockFor(g);
          const phase = lifecycleOf(g);
          const needed = Math.max(0, g.minToRun - g.members.length);
          // A paused class is not "on now" whatever the clock says — it is
          // not meeting at all.
          const live = phase === "running" && clock.state === "live";
          const soon = phase === "running" && clock.state === "today";
          const date = dates[g.id] ?? "";
          const isPast = date !== "" && date < today;
          const imminent = date !== "" && date <= addDaysISO(today, 1);
          // `date` is part of the condition, not just of what's rendered: the
          // paragraph below quotes the date and the deadline three days after
          // it, and there is no honest thing for it to say without one.
          const confirming = confirmId === g.id && date !== "";
          const editing = editingId === g.id;
          const adding = addingId === g.id;
          const membersOpen = membersOpenId === g.id;
          return (
            <Card
              key={g.id}
              // The border says what the class IS; the tint and glow say
              // where the clock has got to. A live class keeps the stronger
              // mint treatment on top of its running border.
              className={[
                LIFECYCLE_CARD[phase],
                live ? "bg-mint/20 shadow-[0_0_0_4px_hsl(var(--mint-strong)/0.25)]" : soon ? "bg-mint/10" : "",
              ].filter(Boolean).join(" ")}
            >
              <CardContent className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {live
                    ? <Radio className="h-4 w-4 shrink-0 text-mint-strong" />
                    : <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="text-sm font-semibold">{g.title}</span>
                  <Badge className={`text-[10px] ${LIFECYCLE_BADGE[phase]}`}>
                    {phase === "running" ? "Running" : phase === "paused" ? "Paused" : "Waiting"}
                    {phase === "waiting" && needed > 0 && ` · needs ${needed} more`}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">{g.language}</Badge>
                  {live && (
                    <Badge className="bg-mint-strong text-charcoal hover:bg-mint-strong text-[10px]">
                      in class now
                    </Badge>
                  )}
                  {soon && (
                    <Badge variant="outline" className="border-mint-strong text-[10px] text-charcoal">
                      today · {untilLabel(clock.minutesUntil ?? 0)}
                    </Badge>
                  )}
                  {phase === "waiting" && !g.isActive && (
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

                {g.startDate && (
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mint-strong" />
                    <span>started {prettyDate(g.startDate)}</span>
                    {clock.nextISO && (
                      <span>
                        · {live ? "on now until the hour is up" : `next class ${prettyDate(clock.nextISO)}`}
                      </span>
                    )}
                    {!g.meetingUrl && <span className="text-amber-600">· no room link</span>}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {/* A started group has no date box: its first class is
                      already on record, and re-running activate_pkg_group
                      would re-date students who are past that question. */}
                  {!g.startDate && (
                    <>
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
                    </>
                  )}
                  {live && g.meetingUrl && (
                    <Button asChild size="sm" className="h-8 bg-mint-strong text-charcoal hover:bg-mint-strong/90">
                      <a href={g.meetingUrl} target="_blank" rel="noreferrer">
                        <Video className="h-3.5 w-3.5 mr-1" /> Open the room
                      </a>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => (editing ? setEditingId(null) : openEdit(g))}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit group
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
                  {g.members.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setWelcomeOpenId(welcomeOpenId === g.id ? null : g.id)}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" /> Send welcome
                    </Button>
                  )}
                  {phase === "running" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-pink-300 text-pink-700 hover:text-pink-700 dark:text-pink-300"
                      disabled={busyId === g.id}
                      onClick={() => void setPaused(g, true)}
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1" />
                      {busyId === g.id ? "Pausing…" : "Pause"}
                    </Button>
                  )}
                  {phase === "paused" && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-mint-strong text-charcoal hover:bg-mint-strong/90"
                      disabled={busyId === g.id}
                      onClick={() => void setPaused(g, false)}
                    >
                      <PlayCircle className="h-3.5 w-3.5 mr-1" />
                      {busyId === g.id ? "Resuming…" : "Resume"}
                    </Button>
                  )}
                </div>

                {phase === "paused" && (
                  <p className="text-[11px] text-pink-700 dark:text-pink-300">
                    Paused — it is not meeting, and nobody new can be seated into it. Its start date, its
                    {" "}{g.members.length} student{g.members.length === 1 ? "" : "s"} and their payment dates are all
                    kept, so Resume puts it straight back.
                  </p>
                )}

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
                  <div className="space-y-2 rounded-md border border-input bg-muted/30 p-2">
                    <div className="flex flex-wrap items-center gap-2">
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
                      <Select value={editLevel} onValueChange={setEditLevel}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map(l => (
                            <SelectItem key={l.key} value={l.key}>{l.shortLabel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={editLanguage} onValueChange={setEditLanguage}>
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue placeholder="Track" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arabic">Arabic track</SelectItem>
                          <SelectItem value="english">English track</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={editCapacity}
                        onChange={e => setEditCapacity(e.target.value)}
                        className="h-8 w-[90px] text-xs"
                        aria-label={`Capacity for ${g.title}`}
                        placeholder="Capacity"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-8 min-w-[240px] flex-1 text-xs"
                        aria-label={`Name for ${g.title}`}
                        placeholder="Group name"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px]"
                        disabled={!editLevel || editDay === "" || !editTime}
                        onClick={() => setEditName(suggestName(editLevel, editDay, editTime, editLanguage))}
                      >
                        Name from schedule
                      </Button>
                    </div>

                    <Input
                      value={editMeetingUrl}
                      onChange={e => setEditMeetingUrl(e.target.value)}
                      className="h-8 text-xs"
                      aria-label={`Meeting link for ${g.title}`}
                      placeholder="Meeting link (optional)"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        disabled={savingEdit || editDay === "" || !editTime}
                        onClick={() => void saveEdit(g)}
                      >
                        {savingEdit ? "Saving…" : "Save"}
                      </Button>
                      {editDay !== "" && editTime && (() => {
                        const bkk = cairoToBangkok(Number(editDay), editTime);
                        return bkk ? (
                          <p className="text-[11px] font-medium text-foreground">
                            = {bkk.day} {bkk.time} for you in Bangkok
                          </p>
                        ) : null;
                      })()}
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Time above is Cairo, same as the rest of the schedule. Day, time, level and track live on this
                      group's own schedule slot; name, capacity and the meeting link live on the group. Existing
                      members and their dates aren't touched.
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
                        <div
                          key={c.userId}
                          className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent"
                        >
                          {/* Clicking the row seats her here (or moves her here
                              if she is sitting somewhere else). The unassign
                              button beside it is the opposite action, so it
                              cannot be nested inside this one. */}
                          <button
                            type="button"
                            disabled={addingBusy}
                            onClick={() => void addStudent(g, c)}
                            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left disabled:opacity-50"
                          >
                            <span className="truncate">{c.name} <span className="text-muted-foreground">· {c.email}</span></span>
                            <span className="flex shrink-0 gap-1">
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
                          {c.currentGroupId && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 shrink-0 px-1.5 text-[10px] text-destructive hover:text-destructive"
                              disabled={removingUserId === c.userId}
                              title={`Take ${c.name} out of ${c.currentGroupTitle} without seating her here`}
                              onClick={() => void unassign(c)}
                            >
                              <UserMinus className="h-3 w-3 mr-0.5" />
                              {removingUserId === c.userId ? "…" : "Unassign"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {welcomeOpenId === g.id && (
                  <GroupWelcomeSender
                    group={{
                      id: g.id,
                      title: g.title,
                      level: g.level,
                      languageKey: g.languageKey,
                      meetingUrl: g.meetingUrl,
                      bookUrl: g.bookUrl,
                      whenLabel: whenLabel(g),
                    }}
                    members={g.members}
                    onSent={() => { setWelcomeOpenId(null); void load(); }}
                  />
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
                      with wherever she currently sits, with an Unassign beside her if you only want her out.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Group Availability — the hours offered to the group matcher, on a week board.
 *
 * WHAT THIS SCREEN CONTROLS
 * -------------------------
 * `teacher_availability` holds one row per class START the teacher is willing
 * to take. It is read by the group matcher and the schedule engine
 * (src/lib/scheduleSlotEngine.ts, src/lib/scheduleAutomation.ts). It does NOT
 * control trials, private lessons or the cohorts already running — those live
 * in trial_slots, teacher_availability_rules and schedule_packages, and no
 * amount of editing here moves any of them.
 *
 * The screen used to list bare times — "11:00 PM · Unavailable" — with no day
 * beside them, no duration, no end, and no sign that its five rows were written
 * in April and every one is switched off. Then it said the right things in the
 * wrong shape: seven headings down the page, one full-width card per hour, and
 * an empty-state paragraph for every day with nothing in it.
 *
 * It is now a seven-column board. One column per day, one chip per hour, an
 * empty day a dash. Each chip carries the time on the viewing clock, the same
 * time on the other clock, its state, and its two actions — and says what it
 * runs into, if anything.
 *
 * WHY CLASHES ARE RESOLVED THROUGH REAL INSTANTS
 * ----------------------------------------------
 * Cohorts and trials are anchored to Africa/Cairo; the teacher's own hours to
 * Asia/Bangkok. The gap is +4 today and +5 from 30 October, so every hour is
 * checked on two anchor weeks — this one and a November one — by resolving it
 * to a real instant and re-reading it through Intl. Same method as
 * WeekTimetable.tsx, for the same reason: a hardcoded offset is right until it
 * silently is not.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Her clock and the students' clock. Every time on this screen is shown in both. */
const ZONES = {
  thailand: { tz: "Asia/Bangkok", short: "Thailand" },
  cairo: { tz: "Africa/Cairo", short: "Cairo" },
} as const;
type ZoneKey = keyof typeof ZONES;

/** Rows in `teacher_availability` carry no zone column; they are the teacher's own clock. */
const SLOT_TZ = ZONES.thailand.tz;

/**
 * How long an offered slot is assumed to run when checking it for collisions.
 * The table stores a start and nothing else. Every group class in
 * schedule_packages is 60 minutes, so 60 is the honest assumption — and it is
 * stated on screen rather than hidden here.
 */
const ASSUMED_MIN = 60;

/** 1 Nov 2026 is a Sunday, and Egypt has left summer time by then. */
const AFTER_ANCHOR = "2026-11-01";

/* ── time helpers ─────────────────────────────────────────────────────────── */

const hhmm = (t: string) => {
  const [h, m] = (t ?? "").split(":");
  return `${String(Number(h) || 0).padStart(2, "0")}:${String(Number(m ?? 0) || 0).padStart(2, "0")}`;
};

function sundayOf(d: Date): string {
  const c = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  c.setUTCDate(c.getUTCDate() - c.getUTCDay());
  return c.toISOString().slice(0, 10);
}
const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The instant at which `time` occurs on `date` in `tz`. */
function instantOf(date: string, time: string, tz: string): Date {
  const asUTC = new Date(`${date}T${hhmm(time)}:00Z`);
  if (Number.isNaN(asUTC.getTime())) return asUTC;
  const seen = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(asUTC).replace(", ", "T").replace("T24:", "T00:");
  const offset = new Date(seen + "Z").getTime() - asUTC.getTime();
  return new Date(asUTC.getTime() - offset);
}

/** Where an instant lands in `tz` — the weekday can differ from the source day. */
function readIn(instant: Date, tz: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "0";
  const wd = SHORT.indexOf(get("weekday"));
  return {
    weekday: wd < 0 ? 0 : wd,
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

const label = (min: number) => {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  const ampm = h < 12 ? "am" : "pm", h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
};

/** "Mon 7pm" in a given zone, for a (weekday, HH:MM) pair stored in SLOT_TZ. */
function readSlot(weekday: number, time: string, tz: string, anchor: string) {
  const at = readIn(instantOf(addDays(anchor, weekday), time, SLOT_TZ), tz);
  return { ...at, text: `${SHORT[at.weekday]} ${label(at.minutes)}` };
}

/* ── data ─────────────────────────────────────────────────────────────────── */

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  is_available: boolean;
}

/** Anything already standing in the week, from the tables that really govern it. */
interface Commitment {
  weekday: number;      // in its own zone
  start: string;        // HH:MM in its own zone
  minutes: number;
  tz: string;
  what: string;
}

async function loadCommitments(): Promise<Commitment[]> {
  const [packages, groups, slots, rules] = await Promise.all([
    supabase.from("schedule_packages")
      .select("id, day_of_week, start_time, duration_min, timezone, level, is_active")
      .eq("course_type", "group").eq("is_active", true),
    supabase.from("pkg_groups").select("package_id, name"),
    supabase.from("trial_slots")
      .select("day_of_week, start_time, duration_min, timezone, class_language, is_active, lifecycle")
      .eq("is_active", true).eq("lifecycle", "active"),
    supabase.from("teacher_availability_rules")
      .select("weekday, start_time, end_time, timezone, note, kind, effective_to")
      .eq("kind", "blocked"),
  ]);
  for (const r of [packages, groups, slots, rules]) if (r.error) throw r.error;

  const groupName = new Map<string, string>();
  for (const g of groups.data ?? []) {
    if (!groupName.has(g.package_id as string)) groupName.set(g.package_id as string, g.name as string);
  }

  const today = new Date().toISOString().slice(0, 10);
  const out: Commitment[] = [];

  for (const p of packages.data ?? []) {
    out.push({
      weekday: p.day_of_week as number,
      start: p.start_time as string,
      minutes: (p.duration_min as number) ?? 60,
      tz: (p.timezone as string) || "Africa/Cairo",
      what: groupName.get(p.id as string) ?? `${p.level} course`,
    });
  }
  for (const s of slots.data ?? []) {
    out.push({
      weekday: s.day_of_week as number,
      start: s.start_time as string,
      minutes: (s.duration_min as number) ?? 30,
      tz: (s.timezone as string) || "Africa/Cairo",
      what: `Trial · ${s.class_language === "arabic" ? "Arabic" : "English"}`,
    });
  }
  for (const r of rules.data ?? []) {
    // A rule dated out is history, not a commitment — the column exists so a
    // lesson can be ended on a date without erasing that it ever happened.
    if (r.effective_to && (r.effective_to as string) < today) continue;
    const [sh, sm] = hhmm(r.start_time as string).split(":").map(Number);
    const [eh, em] = hhmm(r.end_time as string).split(":").map(Number);
    const span = (eh * 60 + em) - (sh * 60 + sm);
    if (span <= 0) continue;   // crosses midnight: compared by hand, not here
    out.push({
      weekday: r.weekday as number,
      start: r.start_time as string,
      minutes: span,
      tz: (r.timezone as string) || "Africa/Cairo",
      what: (r.note as string) || "Private lesson",
    });
  }
  return out;
}

/* ── component ────────────────────────────────────────────────────────────── */

const TeacherAvailabilityManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [zone, setZone] = useState<ZoneKey>("thailand");
  const [newTime, setNewTime] = useState("");
  const [newDay, setNewDay] = useState("1");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [own, week] = await Promise.all([
        supabase.from("teacher_availability")
          .select("id, day_of_week, start_time, is_available")
          .eq("teacher_id", user.id)
          .order("day_of_week").order("start_time"),
        loadCommitments(),
      ]);
      if (own.error) throw own.error;
      setSlots((own.data ?? []) as Slot[]);
      setCommitments(week);
    } catch (err) {
      toast({
        title: "Couldn't load your availability",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { void load(); }, [load]);

  const viewTz = ZONES[zone].tz;
  const otherKey: ZoneKey = zone === "thailand" ? "cairo" : "thailand";
  const thisWeek = useMemo(() => sundayOf(new Date()), []);

  /**
   * What an offered hour runs into, checked on two weeks: this one, and one in
   * November. A Cairo-anchored class and a Bangkok-anchored lesson move apart
   * on 30 October, so one week is not an answer.
   */
  const clashesFor = useCallback((slot: Slot): string[] => {
    const found = new Map<string, string>();
    for (const anchor of [thisWeek, AFTER_ANCHOR]) {
      const myStart = instantOf(addDays(anchor, slot.day_of_week), slot.start_time, SLOT_TZ).getTime();
      const myEnd = myStart + ASSUMED_MIN * 60_000;
      for (const c of commitments) {
        const cs = instantOf(addDays(anchor, c.weekday), c.start, c.tz).getTime();
        const ce = cs + c.minutes * 60_000;
        if (myStart < ce && cs < myEnd) {
          const when = anchor === thisWeek ? "now" : "from 30 Oct";
          const prev = found.get(c.what);
          found.set(c.what, prev && prev !== when ? "now and from 30 Oct" : when);
        }
      }
    }
    return [...found.entries()].map(([what, when]) => `${what} (${when})`);
  }, [commitments, thisWeek]);

  const rows = useMemo(
    () =>
      slots.map(s => ({
        slot: s,
        here: readSlot(s.day_of_week, s.start_time, viewTz, thisWeek),
        there: readSlot(s.day_of_week, s.start_time, ZONES[otherKey].tz, thisWeek),
        clashes: clashesFor(s),
      })),
    [slots, viewTz, otherKey, thisWeek, clashesFor],
  );

  const byDay = useMemo(() => {
    const m = new Map<number, typeof rows>();
    for (const r of rows) {
      const list = m.get(r.here.weekday) ?? [];
      list.push(r);
      m.set(r.here.weekday, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.here.minutes - b.here.minutes);
    return m;
  }, [rows]);

  const offered = rows.filter(r => r.slot.is_available).length;
  const paused = rows.length - offered;
  const clashing = rows.filter(r => r.slot.is_available && r.clashes.length > 0).length;

  /** The other clock, live, before anything is written. */
  const preview = useMemo(() => {
    if (!/^\d{1,2}:\d{2}$/.test(newTime)) return null;
    const d = Number(newDay);
    const t = hhmm(newTime);
    return {
      mine: readSlot(d, t, ZONES.thailand.tz, thisWeek),
      theirs: readSlot(d, t, ZONES.cairo.tz, thisWeek),
      clashes: clashesFor({ id: "preview", day_of_week: d, start_time: t, is_available: true }),
    };
  }, [newTime, newDay, thisWeek, clashesFor]);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!/^\d{1,2}:\d{2}$/.test(newTime)) {
      toast({ title: "Time must look like 14:00", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("teacher_availability").insert({
        teacher_id: user.id,
        day_of_week: Number(newDay),
        start_time: hhmm(newTime),
        is_available: true,
      });
      if (error) throw error;
      toast({ title: "Hour added", description: `${DAYS[Number(newDay)]} ${hhmm(newTime)} your time` });
      setNewTime("");
      await load();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      toast({
        title: code === "23505" ? "That day and time is already on the list" : "Couldn't add it",
        description: code === "23505" ? undefined : err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (slot: Slot) => {
    setBusyId(slot.id);
    try {
      const { error } = await supabase.from("teacher_availability")
        .update({ is_available: !slot.is_available }).eq("id", slot.id);
      if (error) throw error;
      await load();
    } catch (err) {
      toast({
        title: "Couldn't change that",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (slot: Slot) => {
    setBusyId(slot.id);
    try {
      const { error } = await supabase.from("teacher_availability").delete().eq("id", slot.id);
      if (error) throw error;
      toast({ title: "Hour removed" });
      await load();
    } catch (err) {
      toast({
        title: "Couldn't remove it",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const seg = (on: boolean) =>
    `rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
      on ? "bg-foreground font-semibold text-background" : "font-medium text-muted-foreground hover:bg-muted"
    }`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Hours you offer for group classes
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-xs">
              Where the matcher may put a <strong className="font-semibold">new</strong> group — each one a
              class start, counted as {ASSUMED_MIN} minutes. Classes that already exist are set elsewhere;
              they appear here only as a warning when an hour would run into one.
            </CardDescription>
          </div>
          <div className="flex gap-1 rounded-lg border p-1">
            {(Object.keys(ZONES) as ZoneKey[]).map(k => (
              <button key={k} type="button" className={seg(zone === k)} onClick={() => setZone(k)}>
                {ZONES[k].short}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{offered} offered</Badge>
          {paused > 0 && <Badge variant="outline">{paused} paused</Badge>}
          {clashing > 0 && <Badge variant="destructive">{clashing} clash with a real class</Badge>}
          <span className="text-xs text-muted-foreground">· shown in {ZONES[zone].short} time</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add — one line */}
        <form onSubmit={addSlot} className="rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[8rem] flex-1">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground" htmlFor="ta-day">
                Day
              </label>
              <select
                id="ta-day"
                value={newDay}
                onChange={e => setNewDay(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground" htmlFor="ta-time">
                Start ({ZONES.thailand.short})
              </label>
              <Input
                id="ta-time"
                className="h-9"
                inputMode="numeric"
                placeholder="14:00"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="h-9" disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Add
            </Button>
            {preview && (
              <p className="basis-full text-xs sm:basis-auto">
                <span className="font-medium">
                  {preview.mine.text} yours = {preview.theirs.text} students
                </span>
                {preview.clashes.length > 0 && (
                  <span className="ml-2 text-destructive">· runs into {preview.clashes.join(", ")}</span>
                )}
              </p>
            )}
          </div>
        </form>

        {/* The week, as a board */}
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm font-medium">No hours offered yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
              Until one is added, the matcher has nowhere to put a new group. Add the hours you would
              take a brand-new class in — not the ones already taken.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {DAYS.map((day, d) => {
              const list = byDay.get(d) ?? [];
              return (
                <div key={day} className="rounded-lg border bg-card">
                  <div className="flex items-baseline justify-between border-b px-2.5 py-1.5">
                    <span className="text-xs font-semibold">{SHORT[d]}</span>
                    {list.length > 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground">{list.length}</span>
                    )}
                  </div>

                  {list.length === 0 ? (
                    <p className="px-2.5 py-3 text-center text-[11px] text-muted-foreground">—</p>
                  ) : (
                    <div className="space-y-1.5 p-1.5">
                      {list.map(({ slot, here, there, clashes }) => {
                        const busy = busyId === slot.id;
                        const bad = clashes.length > 0;
                        return (
                          <div
                            key={slot.id}
                            title={
                              `${here.text} ${ZONES[zone].short} · ${there.text} ${ZONES[otherKey].short}` +
                              (bad ? ` · runs into ${clashes.join(", ")}` : "")
                            }
                            className={`rounded-md border px-2 py-1.5 ${
                              bad
                                ? "border-destructive/40 bg-destructive/5"
                                : slot.is_available
                                  ? "bg-background"
                                  : "border-dashed bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-sm font-semibold tabular-nums ${
                                  slot.is_available ? "" : "text-muted-foreground line-through"
                                }`}
                              >
                                {label(here.minutes)}
                              </span>
                              <span className="flex shrink-0 items-center">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => toggle(slot)}
                                  aria-label={slot.is_available ? "Pause this hour" : "Offer this hour"}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : slot.is_available ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => remove(slot)}
                                  aria-label="Remove this hour"
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            </div>

                            <p className="text-[10px] leading-tight text-muted-foreground">
                              {there.text} {ZONES[otherKey].short}
                            </p>

                            {bad ? (
                              <p className="mt-1 flex items-start gap-1 text-[10px] leading-tight text-destructive">
                                <AlertTriangle className="mt-px h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{clashes[0]}</span>
                              </p>
                            ) : (
                              !slot.is_available && (
                                <p className="mt-1 text-[10px] leading-tight text-muted-foreground">paused</p>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="flex items-start gap-2 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Clashes are checked on two weeks — this one and a November one — because Klovers classes
            are anchored to Cairo and your own hours to Thailand, and the two move an hour apart when
            Egypt leaves summer time on 30&nbsp;October. The full week, including the classes already
            running, is on <strong className="font-semibold text-foreground">/admin/week</strong>.
          </span>
        </p>
      </CardContent>
    </Card>
  );
};

export default TeacherAvailabilityManager;

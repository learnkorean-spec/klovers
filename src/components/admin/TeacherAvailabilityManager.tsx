/**
 * Group Availability — the hours offered to the group matcher, and what is
 * already standing in them.
 *
 * WHAT THIS SCREEN ACTUALLY CONTROLS
 * ----------------------------------
 * `teacher_availability` holds one row per class START the teacher is willing
 * to take. It is read by the group matcher and the schedule engine
 * (src/lib/scheduleSlotEngine.ts, src/lib/scheduleAutomation.ts). It does NOT
 * control trials, private lessons or the cohorts already running — those live
 * in trial_slots, teacher_availability_rules and schedule_packages, and no
 * amount of editing here moves any of them.
 *
 * The screen used to say none of that. It listed bare times — "11:00 PM ·
 * Unavailable" — with no day context, no duration, no end time, and no hint
 * that the five rows on it were written in April and every one of them is
 * switched off. A teacher reading it could not tell whether it described her
 * week, contradicted it, or meant anything at all.
 *
 * WHAT CHANGED
 * ------------
 *  · Every time is shown on BOTH clocks — hers (Asia/Bangkok) and the
 *    students' (Africa/Cairo) — because a row stored on one and read on the
 *    other is how a class ends up offered at midnight.
 *  · An offered hour that collides with a cohort, a trial or a private lesson
 *    now says so, on the row, in words. Checked on two dates: this week and a
 *    November week, because Egypt leaves summer time on 30 October and a pair
 *    that clears today can overlap then.
 *  · Paused rows are visibly paused, and the empty state says what to do.
 *  · The add form previews the other clock before anything is written.
 *
 * WHY THE CONFLICT CHECK IS RESOLVED THROUGH REAL INSTANTS
 * --------------------------------------------------------
 * Cohorts and trials are anchored to Africa/Cairo; the teacher's own hours are
 * anchored to Asia/Bangkok. The gap between them is +4 today and +5 from 30
 * October. Hardcoding either is the kind of constant that is right until it
 * silently is not, so each row is resolved to an instant on a real date and
 * re-read through Intl in the viewing zone — the same method WeekTimetable.tsx
 * uses, for the same reason.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Her clock and the students' clock. Every time on this screen is shown in both. */
const ZONES = {
  thailand: { tz: "Asia/Bangkok", label: "Yours (Thailand)", short: "Thailand" },
  cairo: { tz: "Africa/Cairo", label: "Students (Cairo)", short: "Cairo" },
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
  created_at?: string;
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
          .select("id, day_of_week, start_time, is_available, created_at")
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

  const rows = useMemo(() => {
    return slots.map(s => {
      const here = readSlot(s.day_of_week, s.start_time, viewTz, thisWeek);
      const there = readSlot(s.day_of_week, s.start_time, ZONES[otherKey].tz, thisWeek);
      return { slot: s, here, there, clashes: clashesFor(s) };
    });
  }, [slots, viewTz, otherKey, thisWeek, clashesFor]);

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

  const offered = rows.filter(r => r.slot.is_available);
  const clashing = rows.filter(r => r.slot.is_available && r.clashes.length > 0);

  /** The other clock, live, before anything is written. */
  const preview = useMemo(() => {
    if (!/^\d{1,2}:\d{2}$/.test(newTime)) return null;
    const d = Number(newDay);
    const t = hhmm(newTime);
    const mine = readSlot(d, t, ZONES.thailand.tz, thisWeek);
    const theirs = readSlot(d, t, ZONES.cairo.tz, thisWeek);
    const probe: Slot = { id: "preview", day_of_week: d, start_time: t, is_available: true };
    return { mine, theirs, clashes: clashesFor(probe) };
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
      toast({
        title: "Hour added",
        description: `${DAYS[Number(newDay)]} ${label(
          Number(hhmm(newTime).slice(0, 2)) * 60 + Number(hhmm(newTime).slice(3)),
        )} your time`,
      });
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
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      on ? "bg-foreground font-semibold text-background" : "font-medium text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hours you offer for group classes
          </CardTitle>
          <CardDescription className="max-w-3xl">
            The hours the group matcher is allowed to put a NEW group into. Each one is a class
            start, counted as {ASSUMED_MIN} minutes long. This list does not move a class that
            already exists — cohorts, trials and private lessons are set elsewhere and are only
            shown here so you can see what an hour would run into.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* At a glance */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {offered.length} offered
            </Badge>
            {slots.length - offered.length > 0 && (
              <Badge variant="outline" className="text-sm">
                {slots.length - offered.length} paused
              </Badge>
            )}
            {clashing.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                {clashing.length} clash with a real class
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">
                SHOW TIMES IN
              </span>
              <div className="flex gap-1 rounded-lg border p-1">
                {(Object.keys(ZONES) as ZoneKey[]).map(k => (
                  <button key={k} type="button" className={seg(zone === k)} onClick={() => setZone(k)}>
                    {ZONES[k].short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add */}
          <form onSubmit={addSlot} className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Offer another hour</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="ta-day">
                  Day
                </label>
                <select
                  id="ta-day"
                  value={newDay}
                  onChange={e => setNewDay(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="ta-time">
                  Start time — 24h, your clock ({ZONES.thailand.short})
                </label>
                <Input
                  id="ta-time"
                  inputMode="numeric"
                  placeholder="14:00"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add
                </Button>
              </div>
            </div>

            {preview && (
              <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
                <span className="font-medium text-foreground">
                  {preview.mine.text} your time = {preview.theirs.text} for students
                </span>
                {preview.clashes.length > 0 && (
                  <span className="mt-1 flex items-start gap-1.5 text-destructive">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    Runs into {preview.clashes.join(", ")}
                  </span>
                )}
              </div>
            )}
          </form>

          {/* The week */}
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <p className="text-sm font-medium text-foreground">No hours offered yet</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                Until one is added here, the matcher has nowhere to put a new group. Add the hours
                you would be willing to teach a brand-new class in — not the ones already taken.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {DAYS.map((day, d) => {
                const list = byDay.get(d) ?? [];
                return (
                  <div key={day}>
                    <div className="mb-2 flex items-baseline gap-2">
                      <h4 className="text-sm font-semibold">{day}</h4>
                      <span className="text-xs text-muted-foreground">
                        {ZONES[zone].short} time
                      </span>
                    </div>
                    {list.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        Nothing offered
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {list.map(({ slot, here, there, clashes }) => {
                          const busy = busyId === slot.id;
                          return (
                            <div
                              key={slot.id}
                              className={`rounded-lg border px-3 py-2.5 transition ${
                                slot.is_available ? "bg-card" : "bg-muted/40"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                                    {label(here.minutes)}
                                    <span className="font-normal text-muted-foreground">
                                      = {there.text} {ZONES[otherKey].short}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-xs">
                                    {slot.is_available ? (
                                      <span className="font-medium text-foreground">
                                        Offered · a group can be placed here
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Paused · the matcher ignores it
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={slot.is_available ? "outline" : "default"}
                                    disabled={busy}
                                    onClick={() => toggle(slot)}
                                  >
                                    {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                    {slot.is_available ? "Pause" : "Offer"}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={busy}
                                    onClick={() => remove(slot)}
                                    aria-label={`Remove ${day} ${label(here.minutes)}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {clashes.length > 0 && (
                                <p className="mt-2 flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                  <span>
                                    Runs into <strong className="font-semibold">{clashes.join(", ")}</strong>
                                    {slot.is_available && " — a group placed here would sit on top of it."}
                                  </span>
                                </p>
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

          <p className="flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Clashes are checked twice — against this week and against a November week — because
              Klovers classes are anchored to Cairo and your own hours to Thailand, and the two
              move an hour apart when Egypt leaves summer time on 30&nbsp;October. The whole week,
              including the classes already running, is on <strong className="font-semibold text-foreground">/admin/week</strong>.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAvailabilityManager;

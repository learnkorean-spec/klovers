/**
 * The teaching week on one screen: every trial, every Hangul cohort, and the
 * hours the teacher is not free, laid out on a 7-day grid.
 *
 * WHY THIS SCREEN EXISTS
 * ----------------------
 * Four tables decide whether a class can happen, and until now the only way to
 * see them together was to open four screens and hold the arithmetic in your
 * head. That is how a trial was scheduled on top of a paid cohort, and later on
 * top of a private lesson — both caught by hand, days apart, after the rows
 * were already live.
 *
 * NOTHING HERE IS HARDCODED
 * -------------------------
 * Every block is read from the row that governs it, so this cannot drift from
 * what the booking guards enforce:
 *
 *   trial_slots                 the free 30-minute sessions
 *   schedule_packages           the paid cohorts (inactive ones shown dashed)
 *   pkg_groups                  the only place a cohort's LANGUAGE is recorded
 *   teacher_availability_rules  kind='blocked' — the day job and private lessons
 *
 * THE TIMEZONE PROBLEM THIS SOLVES
 * --------------------------------
 * Rows do not share a clock. Klovers rows are anchored to Africa/Cairo; the
 * teacher's own commitments are stored against Asia/Kuala_Lumpur or Cairo. Egypt
 * leaves summer time on 30 October 2026 and the gap between the two widens by an
 * hour, so a pair that does not overlap today can overlap in November.
 *
 * Rather than hardcode "+4 now, +5 later" — which is the kind of constant that is
 * right until it silently is not — each block is resolved to a real instant on a
 * real date and re-read in the viewing zone through Intl. The "after 30 October"
 * view is nothing more than the same computation anchored to a November week, so
 * it stays correct through this and every future rule change, including ones
 * nobody has told this file about.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

type Kind = "trial" | "cohort" | "cohort-closed" | "blocked";

interface Block {
  id: string;
  weekday: number;      // 0 = Sunday, in the VIEWING zone
  start: number;        // minutes past midnight, in the VIEWING zone
  minutes: number;
  kind: Kind;
  title: string;
  sub?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const VIEW_TZ = { cairo: "Africa/Cairo", vietnam: "Asia/Ho_Chi_Minh" } as const;
type ViewZone = keyof typeof VIEW_TZ;

/** The week the "after the clock change" view is anchored to. 1 Nov 2026 is a Sunday. */
const AFTER_ANCHOR = "2026-11-01";

/* ── time helpers ───────────────────────────────────────────────── */

const hhmm = (t: string) => {
  const [h, m] = t.split(":");
  return `${String(Number(h)).padStart(2, "0")}:${String(Number(m ?? 0)).padStart(2, "0")}`;
};
const toMinutes = (t: string) => {
  const [h, m] = hhmm(t).split(":").map(Number);
  return h * 60 + m;
};

/** The Sunday of the week containing `d`, as YYYY-MM-DD. */
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

/**
 * The instant at which `time` occurs on `date` in `tz`.
 *
 * Treat the wall time as UTC, ask Intl what that instant looks like in the zone,
 * and subtract the difference. Two steps rather than one because JavaScript has
 * no way to construct a Date from a zoned wall time directly.
 */
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

/** Where an instant lands in `tz` — the day can differ from the source day. */
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

/* ── data ───────────────────────────────────────────────────────── */

interface RawRow {
  id: string; weekday: number; start: string; minutes: number;
  tz: string; kind: Kind; title: string; sub?: string;
  /**
   * Only `teacher_availability_rules` carries these. A rule is drawn on the
   * week being viewed only while it is in effect there — see `inEffect`.
   * Trials and cohorts have no equivalent and are always current.
   */
  from?: string | null;
  to?: string | null;
}

/**
 * Is a rule in effect on `date`?
 *
 * `teacher_availability_rules` has always had `effective_from` / `effective_to`,
 * and until now nothing read `effective_to` — not this screen, not
 * fn_teacher_timezone, not the booking guards. So retiring a rule by dating it
 * did nothing at all: it kept drawing here forever, which made the column a
 * promise the app did not keep.
 *
 * That mattered the day the day-job block was retired. Ending a commitment is a
 * thing that HAPPENS ON A DATE, not a thing that erases the past, and the
 * "After 30 Oct" view still has to show the week as it will really be. Deleting
 * the rows would have lost the fact that those hours were ever taken; dating
 * them keeps the history and lets both views be right about their own week.
 */
function inEffect(r: RawRow, date: string): boolean {
  if (r.from && date < r.from) return false;
  if (r.to && date > r.to) return false;
  return true;
}

function useScheduleRows() {
  return useQuery<RawRow[]>({
    queryKey: ["admin", "week-timetable"],
    queryFn: async () => {
      const [slots, packages, groups, rules] = await Promise.all([
        supabase.from("trial_slots")
          .select("id, day_of_week, start_time, duration_min, timezone, class_language, capacity")
          .eq("is_active", true),
        supabase.from("schedule_packages")
          .select("id, day_of_week, start_time, duration_min, timezone, level, capacity, is_active")
          .eq("course_type", "group"),
        supabase.from("pkg_groups").select("package_id, name"),
        supabase.from("teacher_availability_rules")
          .select("id, weekday, start_time, end_time, timezone, note, effective_from, effective_to")
          .eq("kind", "blocked"),
      ]);
      for (const r of [slots, packages, groups, rules]) if (r.error) throw r.error;

      const groupName = new Map<string, string>();
      for (const g of groups.data ?? []) {
        if (!groupName.has(g.package_id as string)) groupName.set(g.package_id as string, g.name as string);
      }

      const out: RawRow[] = [];

      for (const s of slots.data ?? []) {
        out.push({
          id: `t-${s.id}`,
          weekday: s.day_of_week as number,
          start: s.start_time as string,
          minutes: (s.duration_min as number) ?? 30,
          tz: (s.timezone as string) || "Africa/Cairo",
          kind: "trial",
          title: "Trial",
          sub: `${s.class_language === "arabic" ? "Arabic" : "English"} · ${s.capacity ?? "?"} seats`,
        });
      }

      for (const p of packages.data ?? []) {
        // Language lives only in the group name — neither table has a column
        // for it — so read it out of there rather than guessing from the day.
        const name = groupName.get(p.id as string) ?? "";
        const lang = /arabic/i.test(name) ? "Arabic" : /english/i.test(name) ? "English" : "";
        out.push({
          id: `c-${p.id}`,
          weekday: p.day_of_week as number,
          start: p.start_time as string,
          minutes: (p.duration_min as number) ?? 60,
          tz: (p.timezone as string) || "Africa/Cairo",
          kind: p.is_active ? "cohort" : "cohort-closed",
          title: `${String(p.level ?? "").replace(/^\w/, c => c.toUpperCase())} course`,
          sub: [lang, p.is_active ? `${p.capacity ?? "?"} seats` : "not open yet"]
            .filter(Boolean).join(" · "),
        });
      }

      for (const r of rules.data ?? []) {
        const from = toMinutes(r.start_time as string);
        const to = toMinutes(r.end_time as string);
        const span = (to > from ? to : to + 1440) - from;
        out.push({
          id: `b-${r.id}`,
          weekday: r.weekday as number,
          start: r.start_time as string,
          minutes: span,
          tz: (r.timezone as string) || "Africa/Cairo",
          kind: "blocked",
          title: (r.note as string) || "Blocked",
          from: (r.effective_from as string | null) ?? null,
          to: (r.effective_to as string | null) ?? null,
        });
      }

      return out;
    },
  });
}

/* ── presentation ───────────────────────────────────────────────── */

const TONE: Record<Kind, string> = {
  trial: "bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-900",
  cohort: "bg-orange-50 text-orange-900 ring-1 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:ring-orange-900",
  "cohort-closed": "border border-dashed border-orange-400 text-orange-700 dark:text-orange-300",
  blocked: "bg-muted text-muted-foreground ring-1 ring-border",
};
const DOT: Record<Kind, string> = {
  trial: "bg-blue-600",
  cohort: "bg-orange-500",
  "cohort-closed": "border border-dashed border-orange-500",
  blocked: "bg-muted-foreground",
};

/** Items that share a day and overlap get side-by-side lanes, never a pile. */
function lane(items: Block[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.minutes - b.minutes);
  const placed: (Block & { lane: number; lanes: number })[] = [];
  let cluster: (Block & { lane: number })[] = [];
  let ends: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const n = Math.max(1, ends.length);
    cluster.forEach(c => placed.push({ ...c, lanes: n }));
    cluster = []; ends = []; clusterEnd = -1;
  };
  for (const it of sorted) {
    if (clusterEnd >= 0 && it.start >= clusterEnd) flush();
    let l = ends.findIndex(e => e <= it.start);
    if (l === -1) { l = ends.length; ends.push(0); }
    ends[l] = it.start + it.minutes;
    clusterEnd = Math.max(clusterEnd, it.start + it.minutes);
    cluster.push({ ...it, lane: l });
  }
  flush();
  return placed;
}

const WeekTimetable = () => {
  const { data: rows, isLoading, error } = useScheduleRows();
  const [view, setView] = useState<ViewZone>("cairo");
  const [period, setPeriod] = useState<"now" | "after">("now");

  const blocks = useMemo<Block[]>(() => {
    if (!rows) return [];
    const anchor = period === "now" ? sundayOf(new Date()) : AFTER_ANCHOR;
    const tz = VIEW_TZ[view];
    return rows.flatMap(r => {
      const date = addDays(anchor, r.weekday);
      // Dated out of the week being viewed: not drawn here, still in the table.
      if (!inEffect(r, date)) return [];
      const at = readIn(instantOf(date, r.start, r.tz), tz);
      return [{
        id: r.id, kind: r.kind, title: r.title, sub: r.sub,
        weekday: at.weekday,
        start: at.minutes,
        // Clip anything running past midnight so it cannot draw outside the grid.
        minutes: Math.min(r.minutes, 1440 - at.minutes),
      }];
    });
  }, [rows, view, period]);

  const bounds = useMemo(() => {
    if (!blocks.length) return { lo: 480, hi: 1320 };
    const lo = Math.floor(Math.min(...blocks.map(b => b.start)) / 60) * 60 - 30;
    const hi = Math.ceil(Math.max(...blocks.map(b => b.start + b.minutes)) / 60) * 60 + 30;
    return { lo: Math.max(0, lo), hi: Math.min(1440, hi) };
  }, [blocks]);

  const PX = 0.85;
  const height = (bounds.hi - bounds.lo) * PX;

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading the week…</div>;
  }
  if (error) {
    return (
      <div className="m-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  }

  const seg = (on: boolean) =>
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      on ? "bg-foreground font-semibold text-background" : "font-medium text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">The teaching week</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
          Trials, Hangul cohorts and blocked hours on one grid, read live from the rows that
          govern them. Klovers classes are anchored to Cairo; work and private lessons are not —
          so the two sets move apart when Egypt leaves summer time on 30&nbsp;October.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-5">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">SHOW TIMES IN</p>
          <div className="flex gap-1 rounded-lg border p-1">
            <button type="button" className={seg(view === "cairo")} onClick={() => setView("cairo")}>Cairo</button>
            <button type="button" className={seg(view === "vietnam")} onClick={() => setView("vietnam")}>Vietnam</button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground">PERIOD</p>
          <div className="flex gap-1 rounded-lg border p-1">
            <button type="button" className={seg(period === "now")} onClick={() => setPeriod("now")}>This week</button>
            <button type="button" className={seg(period === "after")} onClick={() => setPeriod("after")}>After 30 Oct</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {([
          ["trial", "Trial"], ["cohort", "Course — open"],
          ["cohort-closed", "Course — not open yet"], ["blocked", "Work or private lesson"],
        ] as [Kind, string][]).map(([k, t]) => (
          <span key={k} className="flex items-center gap-2">
            <span className={`h-3 w-3 shrink-0 rounded-sm ${DOT[k]}`} />{t}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="min-w-[820px]">
          <div className="grid border-b" style={{ gridTemplateColumns: "58px repeat(7, 1fr)" }}>
            <div />
            {SHORT.map(d => (
              <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold">{d}</div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: "58px repeat(7, 1fr)" }}>
            <div className="relative border-r" style={{ height }}>
              {Array.from({ length: Math.floor((bounds.hi - Math.ceil(bounds.lo / 60) * 60) / 60) + 1 }, (_, i) => {
                const t = Math.ceil(bounds.lo / 60) * 60 + i * 60;
                return (
                  <span
                    key={t}
                    className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                    style={{ top: (t - bounds.lo) * PX }}
                  >
                    {label(t)}
                  </span>
                );
              })}
            </div>

            {DAYS.map((_, d) => (
              <div key={d} className="relative border-r last:border-r-0" style={{ height }}>
                {Array.from({ length: Math.floor((bounds.hi - bounds.lo) / 60) + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                    style={{ top: i * 60 * PX }}
                  />
                ))}
                {lane(blocks.filter(b => b.weekday === d)).map(b => {
                  const w = 100 / b.lanes;
                  return (
                    <div
                      key={b.id}
                      className={`absolute overflow-hidden rounded-md px-1.5 py-1 text-[11px] leading-tight ${TONE[b.kind]}`}
                      style={{
                        top: (b.start - bounds.lo) * PX,
                        height: Math.max(b.minutes * PX, 28),
                        left: `calc(${b.lane * w}% + 3px)`,
                        right: `calc(${(b.lanes - 1 - b.lane) * w}% + 3px)`,
                      }}
                      title={`${b.title}${b.sub ? ` — ${b.sub}` : ""} · ${label(b.start)}–${label(b.start + b.minutes)}`}
                    >
                      <span className="block text-[9.5px] font-semibold tabular-nums opacity-80">
                        {label(b.start)}–{label(b.start + b.minutes)}
                      </span>
                      <span className="block font-semibold">{b.title}</span>
                      {b.sub && <span className="block opacity-80">{b.sub}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Blocks drawn side by side in one day are <strong className="font-semibold text-foreground">overlapping</strong>,
          not adjacent. Private lessons are stored against Cairo time even though they are
          really fixed to the teacher's own clock — so check them again after 30&nbsp;October
          rather than trusting this view alone for them.
        </span>
      </p>
    </div>
  );
};

export default WeekTimetable;

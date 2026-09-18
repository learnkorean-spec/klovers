/**
 * Who actually came to the trial.
 *
 * The gap this fills, in one sentence: nothing in the database has ever
 * recorded that a trial HAPPENED for a given student. `attendance_response` is
 * what she predicted days beforehand and `status` is where the booking is —
 * neither is about the room. So the letter that follows a trial is aimed by the
 * clock alone and is written in deliberately neutral words, and no report can
 * say what a session's real turnout was.
 *
 * The control is a drop list with THREE states, and the third one is the point:
 *
 *   Not decided yet   the default — nobody has answered
 *   Came
 *   Didn't come
 *
 * "Not decided yet" and "didn't come" are different facts and they call for
 * opposite letters. A two-state control would turn every unopened session into
 * a roomful of no-shows the moment the page loaded, which is the same mistake —
 * guessing — in a nicer costume.
 *
 * ORDER. The students who said they were coming sit at the top, then the
 * silent ones, then the ones who said they couldn't. Alphabetical put the three
 * confirmed students at rows 2, 4 and 6 of eighteen — the people most likely to
 * have actually been in the room, scattered through a list that has to be
 * scrolled. The sort key is her PREDICTION, never the answer already recorded:
 * sorting on `attended` would make a row jump the instant it is answered and
 * the next click would land on somebody else's name.
 *
 * Writes the table directly rather than through an RPC. That matches
 * PrivateClassesToConfirm and TrialAttendanceRoster, and it is safe here
 * because "Admins can manage trial_bookings :: update" already restricts UPDATE
 * on this table to admins; the migration adds the columns and keeps anon from
 * writing them on insert.
 *
 * Scope: dated, live bookings from the last 14 days. Far enough back to catch a
 * session nobody got to on the day, short enough that the card empties itself
 * and stops asking.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

/** true / false / null — the three states, as one value the Select can hold. */
type Mark = "yes" | "no" | "unknown";

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string | null;
  start_time: string | null;
  class_language: string | null;
  attendance_response: string | null;
  attended: boolean | null;
};

interface TrialAttendanceProps {
  /** How many days back to look. The card empties itself as sessions are marked. */
  days?: number;
  /** Rows drawn per session before "Show all". */
  limit?: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Local calendar date as YYYY-MM-DD. Never a sliced UTC string — Cairo is +3. */
function localISODate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-09-18" -> "Fri 18 Sep". Parsed as a plain date, never shifted by a zone. */
function formatSlotDate(iso: string | null): string {
  if (!iso) return "Date TBA";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const month = dt.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${DAY_NAMES[dt.getUTCDay()].slice(0, 3)} ${d} ${month}`;
}

const markOf = (attended: boolean | null): Mark =>
  attended === true ? "yes" : attended === false ? "no" : "unknown";

const MARK_LABEL: Record<Mark, string> = {
  unknown: "Not decided yet",
  yes: "Came",
  no: "Didn't come",
};

/**
 * Sort rank from what she SAID beforehand.
 *
 * Said yes first: those are the people most likely to have been in the room, so
 * they are the rows worth answering first and the ones that should be on screen
 * without scrolling. Said no last: a seat that was given back is the least
 * likely thing on this list to need an answer.
 */
const responseRank = (r: Row): number =>
  r.attendance_response === "yes" ? 0 : r.attendance_response === "no" ? 2 : 1;

const TrialAttendance = ({ days = 14, limit = 8 }: TrialAttendanceProps) => {
  const qc = useQueryClient();
  /** Sessions the admin has opened in full. Collapsed is the default. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, error, isLoading } = useQuery({
    queryKey: ["admin", "trial-attendance", days],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("trial_bookings")
        // `attended` does not exist until migration 20260918190000 is applied.
        // The cast keeps the generated types quiet until they are regenerated;
        // the error path below is what the admin actually sees if it is missing.
        .select("id, name, email, trial_date, start_time, class_language, attendance_response, attended" as "*")
        .neq("status", "cancelled")
        .not("trial_date", "is", null)
        .gte("trial_date", localISODate(-days))
        .lte("trial_date", localISODate(0))
        .order("trial_date", { ascending: false })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const setMark = useMutation({
    mutationFn: async ({ id, mark }: { id: string; mark: Mark }) => {
      const { data: auth } = await supabase.auth.getUser();
      const attended = mark === "yes" ? true : mark === "no" ? false : null;
      const patch: Record<string, unknown> = {
        attended,
        // Clearing the answer clears its provenance too — a stamp left behind
        // would say somebody decided this, and nobody has.
        attendance_marked_at: attended === null ? null : new Date().toISOString(),
        attendance_marked_by: attended === null ? null : auth.user?.id ?? null,
      };
      const { error } = await supabase
        .from("trial_bookings")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "trial-attendance"] });
      qc.invalidateQueries({ queryKey: ["admin", "trial-bookings"] });
    },
    onError: (e: unknown) =>
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      }),
  });

  /** One block per session — the pair (trial_date, start_time) is the session. */
  const sessions = useMemo(() => {
    const by = new Map<string, Row[]>();
    for (const r of data ?? []) {
      const k = `${r.trial_date ?? ""}|${r.start_time ?? ""}`;
      by.set(k, [...(by.get(k) ?? []), r]);
    }
    return [...by.entries()].map(([k, rows]) => ({
      key: k,
      date: rows[0]?.trial_date ?? null,
      time: rows[0]?.start_time ?? null,
      language: rows[0]?.class_language ?? null,
      rows: [...rows].sort(
        (a, b) => responseRank(a) - responseRank(b) || (a.name ?? "").localeCompare(b.name ?? ""),
      ),
      marked: rows.filter(r => r.attended !== null).length,
      came: rows.filter(r => r.attended === true).length,
      confirmed: rows.filter(r => r.attendance_response === "yes").length,
    }));
  }, [data]);

  if (isLoading) return null;

  // A missing column is not "nothing to do", and a card that vanishes says the
  // second thing. Name it instead.
  if (error) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
        <p className="text-sm font-semibold">Who came</p>
        <p className="text-xs text-muted-foreground">
          Not available yet — run the Apply Migrations workflow for{" "}
          <code className="text-[11px]">20260918190000_trial_attendance_mark</code>, then reload.
        </p>
      </div>
    );
  }

  if (sessions.length === 0) return null;

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div>
        <p className="text-sm font-semibold">Who came</p>
        <p className="text-xs text-muted-foreground">
          The ones who said they were coming are at the top. Left as{" "}
          <em>Not decided yet</em> until you say — nothing reads that as a no-show.
        </p>
      </div>

      {sessions.map(s => {
        const isOpen = expanded.has(s.key);
        const shown = isOpen ? s.rows : s.rows.slice(0, limit);
        const hidden = s.rows.length - shown.length;

        return (
          <div key={s.key} className="space-y-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-0.5">
              <span className="text-xs font-semibold">
                {formatSlotDate(s.date)} · {(s.time ?? "TBA").slice(0, 5)}
                {s.language && (
                  <Badge variant="secondary" className="ml-2 text-[10px] capitalize">
                    {s.language}
                  </Badge>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {s.marked === 0
                  ? `${s.rows.length} booked · ${s.confirmed} said yes · none marked`
                  : `${s.came} came · ${s.marked} of ${s.rows.length} marked`}
              </span>
            </div>

            {shown.map(r => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-1 text-sm"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{r.name?.trim() || r.email || "—"}</span>
                  {r.attendance_response === "yes" && (
                    <span className="text-[11px] text-muted-foreground">said yes</span>
                  )}
                  {r.attendance_response === "no" && (
                    <span className="text-[11px] text-muted-foreground">said she couldn't</span>
                  )}
                </span>

                <Select
                  value={markOf(r.attended)}
                  onValueChange={v => setMark.mutate({ id: r.id, mark: v as Mark })}
                  disabled={setMark.isPending}
                >
                  <SelectTrigger className="h-7 w-[9.5rem] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["unknown", "yes", "no"] as Mark[]).map(m => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {MARK_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {(hidden > 0 || isOpen) && (
              <button
                type="button"
                className="pt-1 text-xs text-muted-foreground underline underline-offset-2"
                onClick={() => toggle(s.key)}
              >
                {isOpen ? "Show fewer" : `Show all ${s.rows.length}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrialAttendance;

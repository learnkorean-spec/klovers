/**
 * Who is waiting for a trial, split into the three groups that need different
 * things — so the decision is made before anything is sent, not after.
 *
 * The existing bulk button sends to every unscheduled student whose invitation
 * is stale: one list, one number, one press. On 4 September 2026 that was 57
 * people, and pressing it would have invited a Level 6 student to a Hangul
 * cohort and a student who never told us their level to a class we cannot
 * place them in.
 *
 * This screen does NOT send. It is the step before: see the groups, decide
 * which one goes, then send. Wiring a per-group send means touching the
 * sender inside TrialClassesManager, and duplicating that sender here is how
 * a button's number stops matching the emails that leave — the exact bug this
 * whole screen exists to prevent. One sender, and it stays where it is.
 *
 * It reads trial_bookings directly rather than the v_trial_bookings_admin view
 * the rest of the tab uses, for one reason: the view does not expose
 * rebook_email_sent_at, and without it "never invited" and "re-invite" cannot
 * be told apart — which is the distinction that caused the confusion this is
 * answering.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  groupTrialTargets,
  levelLabel,
  type GroupableBooking,
  type TrialGroup,
  type TrialGroupKey,
} from "./trialGroups";
import { isStaleInvitation } from "./rebookTargets";

interface WaitingRow extends GroupableBooking {
  name: string | null;
  status: string;
}

/**
 * Everyone on the waiting list: booked, never picked a date, not cancelled.
 * The same population the bulk button works from.
 */
function useWaitingList() {
  return useQuery<WaitingRow[]>({
    queryKey: ["trial-admin", "waiting-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_bookings")
        .select("id, name, email, level, class_language, status, rebook_email_sent_at")
        .eq("is_tba", true)
        .neq("status", "cancelled")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WaitingRow[];
    },
  });
}

/** When the dates people are being invited to were last changed. */
function useSlotsUpdatedAt() {
  return useQuery<Date | null>({
    queryKey: ["trial-admin", "slots-updated-at"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_slots")
        .select("updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const raw = (data ?? [])[0]?.updated_at as string | undefined;
      if (!raw) return null;
      const t = Date.parse(raw);
      return Number.isNaN(t) ? null : new Date(t);
    },
  });
}

const GROUP_COPY: Record<
  TrialGroupKey,
  { title: string; who: string; note: string; tone: "ready" | "hold" | "quiet" }
> = {
  hangul: {
    title: "Hangul — complete beginners",
    who: "Said they are starting from zero.",
    note:
      "Both Hangul cohorts exist and are bookable — Arabic Friday 3:00pm, English Saturday 3:00pm, 8 seats each. A trial here has somewhere to go afterwards. These are the only people who can be sold to today.",
    tone: "ready",
  },
  levels: {
    title: "Levels 1–6 — not beginners",
    who: "Told us a level above Hangul.",
    note:
      "No course is open for them yet — only the two Hangul cohorts exist. Invite them and the trial ends with a question that has no answer. Worth holding until a Level 1 cohort opens.",
    tone: "hold",
  },
  noLevel: {
    title: "No level given",
    who: "Signed up without telling us where they are.",
    note:
      "They cannot be placed in a class without a level. The placement test is the right thing to send first — after it they sort themselves into the two groups above.",
    tone: "quiet",
  },
};

const TONE: Record<"ready" | "hold" | "quiet", { dot: string; note: string }> = {
  ready: { dot: "bg-primary ring-1 ring-foreground/25", note: "border-l-foreground bg-muted" },
  hold: {
    dot: "bg-amber-500",
    note: "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  quiet: { dot: "bg-muted-foreground", note: "border-l-muted-foreground bg-muted" },
};

function Chip({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={
        "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " +
        (strong
          ? "border-foreground/25 bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground")
      }
    >
      {children}
    </span>
  );
}

function GroupCard({ group }: { group: TrialGroup }) {
  const copy = GROUP_COPY[group.key];
  const tone = TONE[copy.tone];
  const { counts } = group;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-start gap-4 p-4">
        <div className="min-w-[240px] flex-1">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            {copy.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{copy.who}</p>
        </div>
        <div className="ml-auto text-3xl font-bold leading-none">{counts.total}</div>
      </header>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <Chip>Arabic {counts.arabic}</Chip>
        <Chip>English {counts.english}</Chip>
        {counts.neverInvited > 0 && <Chip strong>{counts.neverInvited} never invited</Chip>}
        {counts.reInvite > 0 && <Chip>{counts.reInvite} re-invite</Chip>}
        {group.levelBreakdown.map((b) => (
          <Chip key={b.level}>
            {levelLabel(b.level)} · {b.count}
          </Chip>
        ))}
      </div>

      <p className={`mx-4 mb-3 border-l-[3px] px-3 py-2 text-[13px] ${tone.note}`}>{copy.note}</p>

      {group.rows.length > 0 && (
        <div className="max-h-72 overflow-auto border-t">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 backdrop-blur">
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 text-left font-semibold">Student</th>
                <th className="px-4 py-2 text-left font-semibold">Level</th>
                <th className="px-4 py-2 text-left font-semibold">Track</th>
                <th className="px-4 py-2 text-left font-semibold">Invitation</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r) => {
                const arabic = (r.class_language ?? "").toLowerCase().startsWith("ar");
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {(r as WaitingRow).name?.trim() || r.email}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{levelLabel(r.level)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded px-1.5 py-0.5 text-[11px] font-semibold " +
                          (arabic
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground text-background")
                        }
                      >
                        {arabic ? "عربي" : "English"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-muted-foreground">
                      {r.rebook_email_sent_at ? "sent before" : "never sent"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function TrialInviteGroups() {
  const waitingQ = useWaitingList();
  const slotsAtQ = useSlotsUpdatedAt();

  const waiting = useMemo(() => waitingQ.data ?? [], [waitingQ.data]);
  const slotsUpdatedAt = slotsAtQ.data ?? null;

  /**
   * Who is actually due an invitation right now, by the same rule the sender
   * uses — an invitation counts only if it was sent after the dates it names
   * were last changed. Shown beside the total so the two numbers can be
   * compared rather than confused.
   */
  const dueNow = useMemo(
    () => waiting.filter((b) => isStaleInvitation(b.rebook_email_sent_at, slotsUpdatedAt)).length,
    [waiting, slotsUpdatedAt],
  );

  const groups = useMemo(() => groupTrialTargets(waiting), [waiting]);
  const neverInvited = useMemo(
    () => waiting.filter((b) => !b.rebook_email_sent_at).length,
    [waiting],
  );

  if (waitingQ.isLoading || slotsAtQ.isLoading) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
        Loading the waiting list…
      </div>
    );
  }

  const error = waitingQ.error || slotsAtQ.error;
  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Stat value={waiting.length} label="waiting for a trial" highlight />
        <Stat value={neverInvited} label="never invited" />
        <Stat value={waiting.length - neverInvited} label="invited before" />
        <Stat value={dueNow} label="due an invitation now" />
      </div>

      <p className="rounded-md border bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
        <strong className="text-foreground">This screen does not send.</strong> It is here to
        decide who should go before anything leaves. Sending is still the existing button, so
        there is only ever one sender and its count cannot drift from this one.
      </p>

      {(["hangul", "levels", "noLevel"] as TrialGroupKey[]).map((key) => (
        <GroupCard key={key} group={groups[key]} />
      ))}
    </div>
  );
}

function Stat({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "min-w-[140px] rounded-lg border bg-card px-4 py-2.5 " +
        (highlight ? "border-foreground shadow-[inset_0_-3px_0_hsl(var(--primary))]" : "")
      }
    >
      <div className="text-2xl font-bold leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

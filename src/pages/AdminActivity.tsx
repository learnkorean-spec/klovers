/**
 * /admin/activity — "Last 7 days".
 *
 * Today is a queue: what needs a decision right now. This is its opposite and
 * its complement — a read of what has already happened, for the days nobody
 * was watching. It answers two questions in one screen: WHAT DID WE DO THIS
 * WEEK, and WHO IS NEW.
 *
 * Written to be read by someone who is not inside the system all day. Every
 * section says in one line what it is and why it matters, and the numbers are
 * spelled out rather than implied — "56 asked, 3 answered" rather than a
 * percentage that hides how small the numerator is.
 *
 * Read-only by design. Every fix lives on the screen that owns it, and each
 * section links there rather than growing its own buttons: a weekly review
 * that also mutates is a review nobody can skim safely.
 *
 * ONE SECTION IS COLLAPSED, AND ONLY ONE
 * --------------------------------------
 * The admin audit log is the most granular thing here — raw column names and
 * raw values, one row per field change. Printed in full it was taller than
 * every other section put together and pushed them off the screen. It now
 * shows a count and a badge per action type, and the rows themselves on
 * request. Everything else stays open: a weekly review that hides its own
 * findings is not a review.
 *
 * WHAT THE SYSTEM SAID IS GONE (22 Sep 2026)
 * ------------------------------------------
 * It reprinted every notification of the week here — cron-health warnings,
 * self-check failures, and TO-DO notes one session had left for another,
 * complete with file paths and branch names. Re, looking at it: "no need for
 * this here." She is right twice over. None of it is what happened in the
 * business this week, which is the one question this page exists to answer;
 * and it has a home already — Notifications, System tab, which the category
 * router now files everything technical into by default (20260922210000).
 *
 * `useWeekReview` still returns `warnings`. It is left in the hook on purpose:
 * the Notifications screen is where that data belongs, not deleted outright.
 *
 * A route of its own, not a `?tab=` deep link, for the same reason Today and
 * The week are: it is not a screen inside AdminDashboard.tsx.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AdminShell from "@/components/admin/AdminShell";
import { useWeekReview, WEEK_DAYS } from "@/hooks/admin/useWeekReview";
import {
  UserPlus, CalendarCheck, Wallet, GraduationCap, ArrowRight, ChevronDown,
} from "lucide-react";

/** "13 Sep, 20:38" in whatever zone the person reading this is actually in. */
function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** "2026-09-18" -> "Fri 18 Sep", read as a plain date and never shifted. */
function day(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

function money(amount: number | null, currency: string | null): string {
  if (amount === null) return "—";
  return `${Number(amount).toLocaleString("en-GB")} ${currency ?? ""}`.trim();
}

const Section = ({
  title, note, action, children,
}: {
  title: string;
  note: string;
  action?: { to: string; label: string };
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">{title}</h2>
      {action && (
        <Link to={action.to} className="text-xs text-muted-foreground underline underline-offset-2">
          {action.label}
        </Link>
      )}
    </div>
    <p className="text-sm text-muted-foreground">{note}</p>
    {children}
  </section>
);

const Stat = ({
  icon, value, label, tone,
}: { icon: React.ReactNode; value: number; label: string; tone?: "alert" }) => (
  <Card className={tone === "alert" && value > 0 ? "border-foreground" : undefined}>
    <CardContent className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {tone === "alert" && value > 0 && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
        )}
        {icon}
      </div>
      <p className="text-2xl font-extrabold leading-none tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

/** Nothing to report is a real answer, and it should look like one. */
const Empty = ({ children }: { children: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4 text-sm text-muted-foreground">{children}</CardContent>
  </Card>
);

const AdminActivity = () => {
  const { data, isLoading, error } = useWeekReview();
  const [showActions, setShowActions] = useState(false);

  const totalBooked = (data?.sessions ?? []).reduce((n, s) => n + s.booked, 0);
  const totalAsked = (data?.sessions ?? []).reduce((n, s) => n + s.asked, 0);
  const totalAnswered = (data?.sessions ?? []).reduce((n, s) => n + s.yes + s.no, 0);
  const totalEmails = (data?.emails ?? []).reduce((n, e) => n + e.count, 0);

  /**
   * The audit log, as a shape you can read in one second: what KIND of thing
   * happened and how often. Six rows of "enrollment deleted · approval_status"
   * say one thing — six enrolments were deleted — and that sentence is the
   * summary. The rows themselves answer "which ones", which is a different
   * question and gets a click.
   */
  const actionSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of data?.adminActions ?? []) {
      const key = a.action.replace(/_/g, " ");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [data]);

  const actorCount = useMemo(
    () => new Set((data?.adminActions ?? []).map(a => a.by)).size,
    [data],
  );

  return (
    <AdminShell activeId="activity">
      <div id="main-content">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 space-y-8">

          <header className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Last 7 days</h1>
            <p className="text-sm text-muted-foreground">
              What happened, and who is new. Everything below covers the last {WEEK_DAYS} days
              {data ? ` — since ${when(data.since)}` : ""}, and is recalculated every time this page
              is opened.
            </p>
          </header>

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-5 text-sm">
                <span className="font-semibold text-destructive">Could not load the week.</span>{" "}
                <span className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Unknown error."}
                </span>
              </CardContent>
            </Card>
          )}

          {isLoading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          )}

          {data && (
            <>
              {/* THE NUMBERS */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  icon={<UserPlus className="h-4 w-4" />}
                  value={data.newPeople.length}
                  label="new signups"
                />
                <Stat
                  icon={<CalendarCheck className="h-4 w-4" />}
                  value={totalAnswered}
                  label={`answered · ${totalAsked} asked · ${totalBooked} booked`}
                />
                <Stat
                  icon={<Wallet className="h-4 w-4" />}
                  value={data.enrollments.length}
                  label="new enrolments"
                />
                <Stat
                  icon={<GraduationCap className="h-4 w-4" />}
                  value={data.lessonsUnanswered.length}
                  label="lessons still unanswered"
                  tone="alert"
                />
              </section>

              {/* WHO IS NEW */}
              <Section
                title="WHO IS NEW"
                note="Everyone who created an account in the last seven days."
                action={{ to: "/admin?tab=leads", label: "Leads" }}
              >
                {data.newPeople.length === 0 ? (
                  <Empty>Nobody signed up this week.</Empty>
                ) : (
                  <Card>
                    <CardContent className="p-0 divide-y">
                      {data.newPeople.map(p => (
                        <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.name || "(no name yet)"}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {p.level && <Badge variant="secondary">{p.level}</Badge>}
                            {p.country
                              ? <Badge variant="outline">{p.country}</Badge>
                              // The country is what decides which currency she is
                              // quoted, so a missing one is worth seeing here.
                              : <Badge variant="outline" className="border-amber-400 text-amber-700">no country</Badge>}
                            <span className="text-xs text-muted-foreground">{when(p.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Section>

              {/* TRIALS */}
              <Section
                title="TRIAL SESSIONS — WHO HAS ANSWERED"
                note="Every session with a date. 'Asked' means the confirmation letter was sent; silence from someone who was asked is a different problem from someone nobody asked."
                action={{ to: "/admin?tab=trials", label: "Trials" }}
              >
                {data.sessions.length === 0 ? (
                  <Empty>No dated trial sessions ahead.</Empty>
                ) : (
                  <Card>
                    <CardContent className="p-0 divide-y">
                      {data.sessions.map(s => (
                        <div key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{day(s.trial_date)}</span>
                            <span className="text-muted-foreground">{s.start_time ?? "TBA"}</span>
                            <Badge variant="secondary" className="capitalize">{s.class_language ?? "any"}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="text-muted-foreground">{s.booked} booked</span>
                            <span className="text-muted-foreground">{s.asked} asked</span>
                            <span className="font-semibold text-foreground">{s.yes} coming</span>
                            {s.no > 0 && <span className="text-muted-foreground">{s.no} can't</span>}
                            {s.silent > 0 && <span className="text-muted-foreground">{s.silent} no reply</span>}
                            {s.asked < s.booked && (
                              <span className="font-semibold text-destructive">
                                {s.booked - s.asked} never asked
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Section>

              {/* MONEY */}
              <Section
                title="MONEY"
                note="Enrolments created this week, with the amount and the currency exactly as recorded."
                action={{ to: "/admin?tab=enrollments", label: "Enrollments" }}
              >
                {data.enrollments.length === 0 ? (
                  <Empty>No new enrolments this week.</Empty>
                ) : (
                  <Card>
                    <CardContent className="p-0 divide-y">
                      {data.enrollments.map(e => (
                        <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{e.name || e.email || "(unknown)"}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.plan_type} · {e.duration}mo · {e.classes_included} classes · {when(e.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold">{money(e.amount, e.currency)}</span>
                            <Badge variant="outline">{e.payment_status}</Badge>
                            <Badge variant="secondary">{e.approval_status}</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Section>

              {/* PRIVATE LESSONS */}
              <Section
                title="PRIVATE LESSONS"
                note="A lesson is not counted against a student's bundle until it is answered for — so anything left unanswered means the classes-remaining figure on that bundle is too high."
                action={{ to: "/admin?tab=my-students", label: "My students" }}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardContent className="p-0">
                      <p className="px-4 pt-3 text-xs font-bold tracking-[0.06em] text-muted-foreground">
                        ANSWERED THIS WEEK
                      </p>
                      {data.lessonsHeld.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-muted-foreground">Nothing recorded.</p>
                      ) : (
                        <div className="divide-y">
                          {data.lessonsHeld.map(l => (
                            <div key={l.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                              <span>
                                <span className="text-muted-foreground">{day(l.session_date)}</span>{" "}
                                <span className="font-medium">{l.student}</span>
                              </span>
                              <Badge variant={l.outcome === "attended" ? "secondary" : "outline"}>
                                {l.outcome === "attended" ? "counted" : "not held"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={data.lessonsUnanswered.length > 0 ? "border-foreground" : undefined}>
                    <CardContent className="p-0">
                      <p className="px-4 pt-3 text-xs font-bold tracking-[0.06em] text-muted-foreground">
                        PASSED WITHOUT AN ANSWER
                      </p>
                      {data.lessonsUnanswered.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-muted-foreground">Nothing outstanding.</p>
                      ) : (
                        <div className="divide-y">
                          {data.lessonsUnanswered.map(l => (
                            <div key={l.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                              <span>
                                <span className="text-muted-foreground">{day(l.session_date)}</span>{" "}
                                <span className="font-medium">{l.student}</span>
                              </span>
                              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                <Link to="/admin/today">
                                  Answer <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </Section>

              {/* ADMIN ACTIONS — a count first, the rows on request. */}
              <Section
                title="WHAT WAS DONE IN THE ADMIN"
                note="Approvals, rejections, deletions and status changes. 'The system' means a scheduled job or a trigger, not a person."
              >
                {data.adminActions.length === 0 ? (
                  <Empty>Nothing was changed in the admin this week.</Empty>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="text-sm font-semibold">
                          {data.adminActions.length} change{data.adminActions.length === 1 ? "" : "s"}
                          <span className="font-normal text-muted-foreground">
                            {" "}· {actorCount} {actorCount === 1 ? "person or job" : "people and jobs"}
                          </span>
                        </span>
                        {actionSummary.map(([name, n]) => (
                          <Badge key={name} variant="outline" className="font-normal">
                            {name} · <span className="ml-1 font-bold">{n}</span>
                          </Badge>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-7 shrink-0 text-xs"
                          aria-expanded={showActions}
                          onClick={() => setShowActions(v => !v)}
                        >
                          {showActions ? "Hide" : `Show all ${data.adminActions.length}`}
                          <ChevronDown
                            className={`ml-1 h-3.5 w-3.5 transition-transform ${showActions ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </div>

                      {showActions && (
                        // Capped and scrollable: opened, it must not take the
                        // page over again the way the old version did.
                        <div className="mt-3 max-h-80 divide-y overflow-y-auto rounded-md border">
                          {data.adminActions.map(a => (
                            <div
                              key={a.id}
                              className="flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-1.5 text-xs"
                            >
                              <span className="min-w-0">
                                <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                                {a.field && <span className="text-muted-foreground"> · {a.field}</span>}
                                {(a.old_value || a.new_value) && (
                                  <span className="text-muted-foreground">
                                    {" "}— {a.old_value || "—"} → {a.new_value || "—"}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {a.by} · {when(a.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Section>

              {/* EMAIL */}
              <Section
                title="EMAIL SENT"
                note={`${totalEmails} letter${totalEmails === 1 ? "" : "s"} left the system this week.`}
              >
                {data.emails.length === 0 ? (
                  <Empty>No email was sent this week.</Empty>
                ) : (
                  <Card>
                    <CardContent className="p-4 flex flex-wrap gap-2">
                      {data.emails.map(e => (
                        <Badge key={e.template} variant="outline" className="font-normal">
                          {e.template.replace(/_/g, " ")} · <span className="font-bold ml-1">{e.count}</span>
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Section>
            </>
          )}

        </div>
      </div>
    </AdminShell>
  );
};

export default AdminActivity;

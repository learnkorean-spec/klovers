/**
 * /admin/email — what actually happened to the letters we sent.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 14 September a batch of 21 admin messages was sent. The screen that sent
 * them said it had sent them. `email_logs` said something more complicated:
 * 29 rows, 21 recipients, and **8 failures** — every one of them
 *
 *     Resend error: 429 rate_limit_exceeded
 *     "You can only make 10 requests per second"
 *
 * The sender fired the whole batch at once, Resend refused a third of it, and
 * an immediate retry rescued all eight. Nobody was missed and nobody got two
 * copies — that time. At a larger batch the retry will not be enough, and the
 * shape of the failure is the dangerous part: the send screen reports success
 * either way, and the only place the truth exists is a table nobody opens.
 *
 * So this screen opens it. Three questions, in the order they matter:
 *
 *   1. Did everyone get it?          reached vs attempted, per batch
 *   2. Did it actually arrive?       delivered, from the Resend webhook
 *   3. What broke, and why?          the error text, not a red dot
 *
 * "SENT" IS NOT "DELIVERED", AND THE DIFFERENCE IS THE POINT
 * ----------------------------------------------------------
 * `sent` means Resend accepted the request. `delivered` means the receiving
 * server accepted the message, and only arrives once the Resend webhook fires
 * (live since 14 Sep 11:14; anything before that timestamp can only ever read
 * `sent`, which is why old rows are labelled rather than counted as failures).
 * A bounce or a complaint lands on the same row later still. The tiles below
 * keep the three apart on purpose — collapsing them into one "sent" number is
 * how a domain's reputation gets damaged quietly.
 *
 * WHAT COUNTS AS A BATCH
 * ----------------------
 * There is no batch id on `email_logs`. Rows are grouped by template plus the
 * minute they were written, which is what a batch looks like from the outside
 * and is accurate enough to answer "did that send work". Two unrelated sends
 * of the same template in the same minute would merge; that has never happened
 * and would be visible as an odd recipient count if it did.
 *
 * Read-only. Admin-only by RLS (`admins can select email_logs`), so this
 * screen needs no policy of its own and can add nothing to the database.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Inbox,
} from "lucide-react";

type Row = {
  id: string;
  template: string | null;
  to_email: string | null;
  to_name: string | null;
  status: string | null;
  error: string | null;
  created_at: string;
  delivered_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
};

const RANGES = [
  { key: "24h", label: "Last 24 hours", hours: 24 },
  { key: "7d", label: "Last 7 days", hours: 24 * 7 },
  { key: "30d", label: "Last 30 days", hours: 24 * 30 },
] as const;

/** The webhook that records deliveries went live at this instant. Rows older
 *  than it can never show `delivered`, and must not be read as if they failed. */
const TELEMETRY_LIVE_AT = Date.parse("2026-09-14T11:14:00Z");

const ok = (s: string | null) => s === "sent" || s === "delivered";

function shortError(e: string | null): string {
  if (!e) return "";
  if (/rate_limit_exceeded|429/.test(e)) return "Rate limit — sent too fast (10/second)";
  if (/Invalid or expired session|401/.test(e)) return "Not authorised — credential problem";
  if (/Missing|required/i.test(e)) return e.replace(/^Resend error:\s*/, "").slice(0, 90);
  return e.replace(/^Resend error:\s*/, "").slice(0, 110);
}

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const EmailDeliveryPanel = () => {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("7d");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (key: typeof range) => {
    setRows(null);
    setError(null);
    const hours = RANGES.find(r => r.key === key)!.hours;
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data, error: err } = await supabase
      .from("email_logs")
      .select("id, template, to_email, to_name, status, error, created_at, delivered_at, bounced_at, complained_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    // Thrown, not swallowed: an empty screen and a blocked screen look
    // identical, and this one is read to decide whether students were missed.
    if (err) { setError(err.message); setRows([]); return; }
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { void load(range); }, [range]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const recipients = new Set(rows.filter(r => ok(r.status)).map(r => (r.to_email ?? "").toLowerCase()));
    return {
      attempts: rows.length,
      recipients: recipients.size,
      delivered: rows.filter(r => r.delivered_at).length,
      failed: rows.filter(r => r.status === "failed").length,
      bounced: rows.filter(r => r.bounced_at).length,
      complained: rows.filter(r => r.complained_at).length,
      preTelemetry: rows.filter(r => ok(r.status) && !r.delivered_at
        && Date.parse(r.created_at) < TELEMETRY_LIVE_AT).length,
    };
  }, [rows]);

  /** template + minute → one batch. */
  const batches = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const key = `${r.template ?? "(none)"}|${r.created_at.slice(0, 16)}`;
      (map.get(key) ?? map.set(key, []).get(key)!).push(r);
    }
    return [...map.entries()]
      .map(([key, rs]) => {
        const reached = new Set(rs.filter(r => ok(r.status)).map(r => (r.to_email ?? "").toLowerCase()));
        const attemptedTo = new Set(rs.map(r => (r.to_email ?? "").toLowerCase()));
        const missed = [...attemptedTo].filter(e => !reached.has(e));
        return {
          key,
          template: key.split("|")[0],
          at: rs[0].created_at,
          attempts: rs.length,
          reached: reached.size,
          missed: missed.length,
          failed: rs.filter(r => r.status === "failed").length,
          delivered: rs.filter(r => r.delivered_at).length,
          duplicated: [...reached].filter(e =>
            rs.filter(r => ok(r.status) && (r.to_email ?? "").toLowerCase() === e).length > 1).length,
        };
      })
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 40);
  }, [rows]);

  const problems = useMemo(
    () => (rows ?? []).filter(r => r.status === "failed" || r.bounced_at || r.complained_at).slice(0, 30),
    [rows],
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Email delivery
          </h1>
          <p className="text-sm text-muted-foreground">
            What happened after the send button — not what the send screen said.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? "default" : "outline"}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="icon" variant="ghost" aria-label="Refresh" onClick={() => void load(range)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-sm">
            <span className="font-semibold text-destructive">Could not read the send log.</span>{" "}
            <span className="text-muted-foreground">{error}</span>
          </CardContent>
        </Card>
      )}

      {!rows ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Inbox className="h-4 w-4" />}
            label="PEOPLE REACHED"
            value={stats.recipients}
            note={`${stats.attempts} attempt${stats.attempts === 1 ? "" : "s"} in total`}
          />
          <Stat
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="CONFIRMED DELIVERED"
            value={stats.delivered}
            note={
              stats.preTelemetry > 0
                ? `${stats.preTelemetry} sent before delivery tracking existed`
                : "confirmed by the mail provider"
            }
          />
          <Stat
            icon={<AlertTriangle className="h-4 w-4" />}
            label="FAILED ATTEMPTS"
            value={stats.failed}
            urgent={stats.failed > 0}
            note={stats.failed > 0 ? "see below — some may have been retried" : "none"}
          />
          <Stat
            icon={<XCircle className="h-4 w-4" />}
            label="BOUNCED · COMPLAINED"
            value={stats.bounced + stats.complained}
            urgent={stats.bounced + stats.complained > 0}
            note={`${stats.bounced} bounced · ${stats.complained} marked spam`}
          />
        </div>
      )}

      {/* BATCHES */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">SENDS</h2>
        {!rows ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : batches.length === 0 ? (
          <Card><CardContent className="p-5 text-sm text-muted-foreground">
            Nothing was sent in this period.
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-semibold">When</th>
                    <th className="px-4 py-2.5 font-semibold">Letter</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Reached</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Delivered</th>
                    <th className="px-4 py-2.5 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.key} className="border-b last:border-0">
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{when(b.at)}</td>
                      <td className="px-4 py-2.5 font-medium">{b.template}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{b.reached}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{b.delivered}</td>
                      <td className="px-4 py-2.5">
                        {b.missed > 0 ? (
                          <Badge variant="destructive">{b.missed} got nothing</Badge>
                        ) : b.duplicated > 0 ? (
                          <Badge variant="destructive">{b.duplicated} sent twice</Badge>
                        ) : b.failed > 0 ? (
                          <Badge variant="outline" className="text-amber-700 border-amber-300">
                            everyone reached · {b.failed} retried
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-700 border-green-300">clean</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">
          “Reached” counts people, not requests. A send that had to retry still reads clean when
          every person ended up with exactly one copy — the retries are shown so a batch that is
          quietly running at the provider’s rate limit is visible before it drops someone.
        </p>
      </section>

      {/* PROBLEMS */}
      {problems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">WHAT WENT WRONG</h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-semibold">When</th>
                    <th className="px-4 py-2.5 font-semibold">Letter</th>
                    <th className="px-4 py-2.5 font-semibold">To</th>
                    <th className="px-4 py-2.5 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{when(p.created_at)}</td>
                      <td className="px-4 py-2.5">{p.template}</td>
                      <td className="px-4 py-2.5 max-w-[220px] truncate">{p.to_name || p.to_email}</td>
                      <td className="px-4 py-2.5">
                        {p.complained_at ? (
                          <span className="font-medium text-destructive">Marked as spam</span>
                        ) : p.bounced_at ? (
                          <span className="font-medium text-destructive">Bounced — address rejected it</span>
                        ) : (
                          <span className="text-muted-foreground">{shortError(p.error)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

const Stat = ({
  icon, label, value, note, urgent,
}: {
  icon: React.ReactNode; label: string; value: number; note: string; urgent?: boolean;
}) => (
  <Card className={urgent ? "border-amber-300" : undefined}>
    <CardContent className="p-4 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-3xl font-extrabold tabular-nums leading-none">{value}</div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </CardContent>
  </Card>
);

export default EmailDeliveryPanel;

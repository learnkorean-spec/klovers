/**
 * MONEY IN — what has been collected, what is still owed, and what a student
 * says she has paid.
 *
 * WHY IT IS ON TODAY
 * The KPI strip that carries these figures is drawn by AdminDashboard, above
 * its `?tab=` screens, and bare /admin redirects to /admin/today. So the screen
 * Re opens every morning showed no money at all. A number nobody passes is a
 * number nobody reads.
 *
 * WHY TWO CARDS AND NOT ONE TOTAL
 * Group students pay through checkout in EGP; private students are entered by
 * hand, each in the currency that student pays in. The system holds no exchange
 * rate, so there is no honest single number — adding them would turn several
 * exact figures into one wrong one.
 *
 * WHY THE UNPAID LIST IS HERE AND NOT BURIED
 * A bundle with no `paid_on` is a student being taught on credit. Mariam had
 * two classes taught against an unpaid bundle and nothing anywhere said so — it
 * was being counted as income instead.
 *
 * AND WHY IT NOW HAS A BUTTON
 * Seeing the debt was never the hard part. Every payment letter this system
 * sends is built on `enrollments`, which a private student does not have, so
 * the only thing that ever told one what she owed was Re writing it out by
 * hand. "Ask for payment" sends the bundle's id and nothing else: the amount
 * and the classes taught are read in the database, off the same bundle this
 * row is drawn from, so the letter cannot state a figure the screen does not.
 *
 * CLAIMS ARE NOT MONEY
 * A student pressing "I have paid" writes a row in `student_payment_claims` and
 * nothing else. Approving it here is what writes `paid_on`. That ordering is the
 * whole point: the balance is Re's, not the student's.
 *
 * AND THE RECEIPT IS WHY THAT ORDERING IS WORTH ANYTHING
 * Until the claim could carry an image, approving one meant believing a typed
 * number. The file sits in the private `receipts` bucket; the link below is
 * minted on the click and expires, because a stored public URL to somebody's
 * bank screenshot is not a thing this app should ever hold.
 */
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Wallet, Inbox, Paperclip, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCollectedRevenue } from "@/hooks/admin/useCollectedRevenue";
import { usePrivateBudgets } from "@/hooks/admin/usePrivateBudgets";

function formatMoney(n: number): string {
  return n.toLocaleString("en-US");
}

/** Today in Cairo, as YYYY-MM-DD — the default answer to "when was this paid". */
function todayInCairo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
}

/** Long enough to open and read the image, short enough not to be a link worth keeping. */
const RECEIPT_URL_TTL_SECONDS = 300;

interface Claim {
  id: string;
  amount: number;
  currency: string;
  paid_on: string;
  method: string;
  sender_name: string | null;
  note: string | null;
  bundle_id: string | null;
  receipt_path: string | null;
  teacher_students: { full_name: string | null } | null;
}

const MoneyIn = () => {
  const queryClient = useQueryClient();
  const { data: revenue, isLoading: revenueLoading } = useCollectedRevenue();
  const { data: privateBudgets, isLoading: privateLoading } = usePrivateBudgets();

  const [dates, setDates] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  // Which bundles have been asked in THIS sitting. The row does not carry
  // payment_ask_sent_at, and the point of saying so is to stop the same letter
  // going out three times in one morning — a question about now, not history.
  const [asked, setAsked] = useState<Record<string, true>>({});

  const loadClaims = useCallback(async () => {
    const { data, error: claimError } = await supabase
      .from("student_payment_claims")
      .select("id, amount, currency, paid_on, method, sender_name, note, bundle_id, receipt_path, teacher_students(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (claimError) return;
    setClaims((data ?? []) as unknown as Claim[]);
  }, []);

  useEffect(() => { void loadClaims(); }, [loadClaims]);

  /**
   * Opens the receipt in a new tab. The URL is signed at this moment and dies
   * five minutes later, so nothing durable links to a student's bank
   * screenshot.
   */
  async function openReceipt(claimId: string, path: string) {
    setBusy(claimId);
    setError(null);
    const { data, error: signError } = await supabase.storage
      .from("receipts")
      .createSignedUrl(path, RECEIPT_URL_TTL_SECONDS);
    setBusy(null);
    if (signError || !data?.signedUrl) {
      setError(signError?.message ?? "Could not open that receipt.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  /**
   * Sends the private-bundle payment letter. Only the id travels: the amount,
   * the classes taught and the number left are read in the database from this
   * bundle's own rows, so a stale figure on this screen cannot become a figure
   * in a student's inbox.
   */
  async function askForPayment(bundleId: string) {
    setBusy(bundleId);
    setError(null);
    const { error: rpcError } = await supabase.rpc("admin_send_bundle_payment_ask", {
      p_bundle_id: bundleId,
    } as never);
    setBusy(null);
    if (rpcError) {
      // These two come back as bare codes from the function and mean something
      // a person can act on, so they are said in words rather than shown raw.
      const known: Record<string, string> = {
        student_has_no_email: "That student has no email address on file — message her on WhatsApp instead.",
        bundle_already_paid: "That bundle is already marked as paid.",
      };
      setError(known[rpcError.message] ?? rpcError.message);
      return;
    }
    setAsked(a => ({ ...a, [bundleId]: true }));
  }

  async function markPaid(id: string, fallback: string | null) {
    const when = dates[id] ?? fallback ?? todayInCairo();
    setBusy(id);
    setError(null);
    const { error: updateError } = await supabase
      .from("student_bundles")
      .update({ paid_on: when })
      .eq("id", id);
    setBusy(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin", "private-budgets"] });
  }

  async function reviewClaim(id: string, approve: boolean) {
    setBusy(id);
    setError(null);
    const { error: rpcError } = await supabase.rpc("admin_review_payment_claim", {
      p_claim_id: id,
      p_approve: approve,
    } as never);
    setBusy(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await Promise.all([
      loadClaims(),
      queryClient.invalidateQueries({ queryKey: ["admin", "private-budgets"] }),
    ]);
  }

  if (revenueLoading || privateLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const currencies = privateBudgets?.byCurrency ?? [];
  const unpaid = privateBudgets?.unpaid ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5 flex h-full flex-col gap-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-bold tracking-[0.04em]">GROUP REVENUE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
                {revenue ? formatMoney(revenue.total) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">{revenue?.currency ?? ""}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {revenue
                ? `Paid and approved · ${revenue.count} enrollment${revenue.count === 1 ? "" : "s"}.`
                : "Paid and approved enrollments."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex h-full flex-col gap-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-bold tracking-[0.04em]">PRIVATE BUDGETS</span>
            </div>
            {currencies.length === 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold leading-none tracking-tight">—</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nothing marked as paid yet.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  {currencies.map(c => (
                    <div key={c.currency} className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold leading-none tracking-tight tabular-nums">
                        {formatMoney(c.total)}
                      </span>
                      <span className="text-sm text-muted-foreground">{c.currency}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Received from {privateBudgets?.students} student
                  {privateBudgets?.students === 1 ? "" : "s"}, each in their own currency.
                  Not converted — there is no rate in the system.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {claims.length > 0 && (
        <Card className="border-foreground">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-bold tracking-[0.04em] text-muted-foreground">
                <Inbox className="h-4 w-4" />
                STUDENTS SAY THEY PAID — {claims.length}
              </span>
              <span className="text-xs text-muted-foreground">
                approving is what marks the bundle paid
              </span>
            </div>

            <ul className="space-y-2">
              {claims.map(c => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">
                      {c.teacher_students?.full_name ?? "A student"}
                    </span>
                    {" · "}
                    <span className="tabular-nums">{formatMoney(Number(c.amount))}</span>{" "}
                    {c.currency}
                    {" · "}
                    {c.paid_on}
                    {" · "}
                    {c.method}
                    {c.sender_name ? ` · from ${c.sender_name}` : ""}
                    {c.note ? ` · ${c.note}` : ""}
                    {!c.bundle_id && (
                      <span className="text-muted-foreground"> · no bundle — records only</span>
                    )}
                  </span>

                  {/* Said in words when there is nothing to open: a claim with no
                      receipt must not be indistinguishable from one whose image
                      failed to load. */}
                  {c.receipt_path ? (
                    <button
                      type="button"
                      onClick={() => void openReceipt(c.id, c.receipt_path!)}
                      disabled={busy === c.id}
                      className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-60"
                    >
                      <Paperclip className="h-3 w-3" /> See receipt
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">no receipt</span>
                  )}

                  <button
                    type="button"
                    onClick={() => void reviewClaim(c.id, true)}
                    disabled={busy === c.id}
                    className="rounded-lg border bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {busy === c.id ? "Saving…" : "Money received"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewClaim(c.id, false)}
                    disabled={busy === c.id}
                    className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-60"
                  >
                    Not found
                  </button>
                </li>
              ))}
            </ul>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {unpaid.length > 0 && (
        <Card className="border-foreground">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-bold tracking-[0.04em] text-muted-foreground">
                NOT MARKED AS PAID — {unpaid.length}
              </span>
              <span className="text-xs text-muted-foreground">
                until one is marked, its money is not counted anywhere
              </span>
            </div>

            <ul className="space-y-2">
              {unpaid.map(b => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{b.student}</span>
                    {" · "}
                    <span className="tabular-nums">{formatMoney(b.total_price)}</span>{" "}
                    {b.currency ?? ""}
                    {b.label ? ` · ${b.label}` : ""}
                  </span>

                  {asked[b.id] ? (
                    <span className="text-xs font-semibold text-muted-foreground">Letter sent</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void askForPayment(b.id)}
                      disabled={busy === b.id}
                      className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-60"
                      title="Emails her the amount, the classes taught, how to pay, and where to upload the receipt"
                    >
                      <Send className="h-3 w-3" />
                      {busy === b.id ? "Sending…" : "Ask for payment"}
                    </button>
                  )}

                  <input
                    type="date"
                    aria-label={`Date ${b.student} paid`}
                    value={dates[b.id] ?? b.purchased_on ?? todayInCairo()}
                    onChange={e => setDates(d => ({ ...d, [b.id]: e.target.value }))}
                    className="rounded-lg border bg-background px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void markPaid(b.id, b.purchased_on)}
                    disabled={busy === b.id}
                    className="rounded-lg border bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {busy === b.id ? "Saving…" : "Mark paid"}
                  </button>
                </li>
              ))}
            </ul>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MoneyIn;

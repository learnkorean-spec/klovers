/**
 * What a student can say for herself — and what saying it does NOT do.
 *
 * Two buttons: "I attended this lesson" and "I paid". Both file a CLAIM. Neither
 * counts a class nor marks money as received: `student_confirm_private_session`
 * stamps `student_confirmed_at`, `student_submit_payment_claim` writes a row in
 * `student_payment_claims`, and Re's confirmation is the only thing that moves a
 * balance or writes `paid_on`. A student can never move her own numbers.
 *
 * WHY THIS EXISTS SEPARATELY FROM StudentAttendanceRequest
 * That card is built on `enrollments` and unlocks only for a group enrolment
 * that is APPROVED and PAID. Every private student — the only students who have
 * a bundle and a weekly lesson — saw "Attendance is available after payment" and
 * could do nothing. Their world is `teacher_students` + `student_bundles` +
 * `student_class_sessions`, which is what this reads.
 *
 * It renders nothing at all for a student who has no roster row, so it is safe
 * to mount beside the group card for everyone.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Loader2, Wallet } from "lucide-react";

interface Props {
  userId: string;
}

interface Bundle {
  id: string;
  label: string | null;
  total_classes: number;
  total_price: number;
  currency: string | null;
  paid_on: string | null;
}

interface SessionRow {
  id: string;
  session_date: string;
  start_time: string | null;
  outcome: string;
  counted: boolean;
  student_confirmed_at: string | null;
}

interface Claim {
  id: string;
  amount: number;
  currency: string;
  paid_on: string;
  method: string;
  status: string;
}

const PAYMENT_METHODS = ["Vodafone Cash", "Fawry", "InstaPay", "Bank transfer", "Other"];
const PAY_NUMBER = "+20 101 000 3084";
const WHATSAPP = "https://wa.me/201010003084";

/** Today in Cairo as YYYY-MM-DD — the calendar the school runs on. */
function cairoToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

const StudentSelfService = ({ userId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [paidOn, setPaidOn] = useState(cairoToday());
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const { data: roster, error: rosterError } = await supabase
      .from("teacher_students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (rosterError) {
            console.error("[StudentSelfService] failed to load roster:", rosterError);
            setLoading(false);
            return;
    }
    
    if (!roster?.id) {
      setStudentId(null);
      setLoading(false);
      return;
    }
    setStudentId(roster.id);

    const [bundleRes, sessionRes, claimRes] = await Promise.all([
      supabase
        .from("student_bundles")
        .select("id, label, total_classes, total_price, currency, paid_on")
        .eq("student_id", roster.id)
        .eq("status", "active")
        .order("purchased_on", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("student_class_sessions")
        .select("id, session_date, start_time, outcome, counted, student_confirmed_at")
        .eq("student_id", roster.id)
        .order("session_date", { ascending: false })
        .limit(20),
      supabase
        .from("student_payment_claims")
        .select("id, amount, currency, paid_on, method, status")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const b = (bundleRes.data ?? null) as Bundle | null;
    setBundle(b);
    if (b?.currency) setCurrency(b.currency);
    setSessions((sessionRes.data ?? []) as SessionRow[]);
    setClaims((claimRes.data ?? []) as Claim[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const used = useMemo(() => sessions.filter(s => s.counted).length, [sessions]);
  const remaining = bundle ? bundle.total_classes - used : 0;

  // A lesson can be claimed once it is in the past and has not been settled yet.
  const toConfirm = useMemo(() => {
    const today = cairoToday();
    return sessions.filter(
      s => s.session_date <= today && !s.counted && s.outcome === "scheduled"
    );
  }, [sessions]);

  async function confirmSession(id: string) {
    setBusy(id);
    const { error } = await supabase.rpc("student_confirm_private_session", {
      p_session_id: id,
    } as never);
    setBusy(null);
    if (error) {
      toast({ title: "Could not send that", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Sent to your teacher",
      description: "She confirms it, and then it comes off your balance.",
    });
    void load();
  }

  async function submitClaim() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: "Enter the amount you paid", variant: "destructive" });
      return;
    }
    setBusy("claim");
    const { error } = await supabase.rpc("student_submit_payment_claim", {
      p_amount: value,
      p_currency: currency,
      p_paid_on: paidOn,
      p_method: method,
      p_sender_name: senderName || null,
      p_note: note || null,
      p_bundle_id: bundle?.id ?? null,
    } as never);
    setBusy(null);
    if (error) {
      toast({ title: "Could not send that", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thank you — sent", description: "Your teacher will confirm it shortly." });
    setShowForm(false);
    setAmount("");
    setNote("");
    setSenderName("");
    void load();
  }

  if (loading) return <Skeleton className="h-40 w-full rounded-lg" />;
  // Not a private student — this card has nothing to say.
  if (!studentId) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My lessons
          </CardTitle>
          {bundle && (
            <p className="text-sm text-muted-foreground">
              {remaining} of {bundle.total_classes} left
              {bundle.label ? ` · ${bundle.label}` : ""}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {toConfirm.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing waiting. After a lesson, it appears here to confirm.
            </p>
          ) : (
            toConfirm.map(s => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{formatDate(s.session_date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.student_confirmed_at
                      ? "Sent — waiting for your teacher"
                      : "Did this lesson happen?"}
                  </p>
                </div>
                {s.student_confirmed_at ? (
                  <Badge variant="secondary">Waiting</Badge>
                ) : (
                  <Button size="sm" disabled={busy === s.id} onClick={() => void confirmSession(s.id)}>
                    {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "I attended"}
                  </Button>
                )}
              </div>
            ))
          )}

          {sessions.some(s => s.counted) && (
            <p className="pt-1 text-xs text-muted-foreground">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              {used} lesson{used === 1 ? "" : "s"} confirmed so far.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment
          </CardTitle>
          {bundle && (
            <p className="text-sm text-muted-foreground">
              {bundle.paid_on
                ? `Received — thank you.`
                : `${bundle.total_price} ${bundle.currency ?? ""} for this package.`}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">How to pay</p>
            <p className="text-muted-foreground">
              Vodafone Cash or Fawry on <span className="font-semibold">{PAY_NUMBER}</span>.
              For a bank transfer, ask on{" "}
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-semibold underline">
                WhatsApp
              </a>{" "}
              and we will send the details.
            </p>
          </div>

          {!showForm ? (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              I have paid — tell my teacher
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs">
                  Amount
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs">
                  Currency
                  <input
                    value={currency}
                    onChange={e => setCurrency(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs">
                  Date paid
                  <input
                    type="date"
                    max={cairoToday()}
                    value={paidOn}
                    onChange={e => setPaidOn(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs">
                  How you paid
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-xs">
                Name or number it came from (optional)
                <input
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                />
              </label>
              <label className="block text-xs">
                Anything else (optional)
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={busy === "claim"} onClick={() => void submitClaim()}>
                  {busy === "claim" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {claims.length > 0 && (
            <div className="space-y-1 pt-1">
              {claims.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">
                    {c.amount} {c.currency} · {formatDate(c.paid_on)} · {c.method}
                  </span>
                  <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                    {c.status === "approved" ? "Confirmed" : c.status === "rejected" ? "Not found" : "Waiting"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSelfService;
